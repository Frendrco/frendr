/**
 * Fetch "New Submission" emails from Framer and export unique signups
 * to frendr-signups.csv using Microsoft Graph API + device code login.
 *
 * Usage:
 *   node scripts/fetch-signups.mjs
 *
 * On first run it will print a URL + code — open the URL in your browser,
 * enter the code, and sign in with ryan@frendr.co. The script continues
 * automatically once authenticated.
 */

import { createWriteStream } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, "../frendr-signups.csv")

const CLIENT_ID  = "85745980-7f48-4ba6-a1af-e72f6c409230"
const TENANT_ID  = "673cac3f-55a2-488d-8d02-388389990885"
const GRAPH_BASE = "https://graph.microsoft.com/v1.0"
const TOKEN_URL  = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`
const DEVICE_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`
const SCOPE      = "Mail.Read offline_access"

// ---------------------------------------------------------------------------
// Auth — device code flow (manual, no MSAL dependency)
// ---------------------------------------------------------------------------

async function getAccessToken() {
  // Step 1: request a device code
  const dcRes = await fetch(DEVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE }),
  })
  if (!dcRes.ok) throw new Error(`Device code request failed: ${await dcRes.text()}`)
  const dc = await dcRes.json()

  console.log("\n─────────────────────────────────────────────")
  console.log(dc.message)
  console.log("─────────────────────────────────────────────\n")
  console.log("Waiting for you to sign in…")

  // Step 2: poll for the token
  const interval = (dc.interval ?? 5) * 1000
  const deadline = Date.now() + (dc.expires_in ?? 900) * 1000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval))

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id:   CLIENT_ID,
        device_code: dc.device_code,
      }),
    })
    const token = await tokenRes.json()

    if (token.access_token) return token.access_token
    if (token.error === "authorization_pending") continue
    if (token.error === "slow_down") { await new Promise((r) => setTimeout(r, 5000)); continue }
    throw new Error(`Auth failed: ${token.error} — ${token.error_description}`)
  }

  throw new Error("Device code expired. Please run the script again.")
}

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------

async function graphGet(token, url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Graph API error ${res.status}: ${await res.text()}`)
  return res.json()
}

async function fetchAllMessages(token) {
  const messages = []
  let url =
    `${GRAPH_BASE}/me/messages` +
    `?$filter=subject eq 'New Submission'` +
    `&$select=id,subject,from,body` +
    `&$top=100`

  while (url) {
    process.stdout.write(`Fetching page… (${messages.length} so far)\r`)
    const page = await graphGet(token, url)
    messages.push(...(page.value ?? []))
    url = page["@odata.nextLink"] ?? null
  }
  process.stdout.write("\n")
  return messages
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")   // remove style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, "")  // remove script blocks entirely
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/td>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")          // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")       // collapse excess blank lines
    .trim()
}

function extractFields(rawText) {
  // Framer sends fields concatenated with no separator, e.g.:
  // "Name: FooName: barEmail: x@y.comCreator Type: Designer"
  // Insert a newline before each known label so we can parse line-by-line.
  const normalised = rawText
    .replace(/(Creator Type|Name|Email)\s*:/gi, "\n$1:")

  const lines = normalised.split("\n")
  let name = null, email = null, creatorType = null, nameFound = false

  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.+)/)
    if (!m) continue
    const label = m[1].trim().toLowerCase()
    const value = m[2].trim()

    if (label === "name" && !nameFound) { name = value; nameFound = true }
    else if (label === "email")          { email = value.toLowerCase() }
    else if (label === "creator type")   { creatorType = value }
  }

  return { name, email, creatorType }
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function csvField(value) {
  const s = value == null ? "" : String(value)
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const token = await getAccessToken()
console.log("Signed in successfully.\n")

const allMessages = await fetchAllMessages(token)

// Keep only messages where sender name or address contains "framer"
const framerMessages = allMessages.filter((m) => {
  const addr = m.from?.emailAddress?.address?.toLowerCase() ?? ""
  const name = m.from?.emailAddress?.name?.toLowerCase() ?? ""
  return addr.includes("framer") || name.includes("framer")
})

console.log(
  `Found ${allMessages.length} "New Submission" email(s), ` +
  `${framerMessages.length} from Framer.`
)


const byEmail = new Map()
let skipped = 0

for (const msg of framerMessages) {
  const bodyContent = msg.body?.content ?? ""
  const bodyText =
    msg.body?.contentType === "html"
      ? stripHtml(bodyContent)
      : bodyContent

  const { name, email, creatorType } = extractFields(bodyText)

  if (!email) {
    console.warn(`  Skipping one message — could not extract email.`)
    skipped++
    continue
  }

  if (!byEmail.has(email)) {
    byEmail.set(email, { name: name ?? "", creatorType: creatorType ?? "" })
  }
}

const out = createWriteStream(OUT_FILE, { encoding: "utf8" })
out.write("email,name,creator_type\n")
for (const [email, { name, creatorType }] of byEmail) {
  out.write([email, name, creatorType].map(csvField).join(",") + "\n")
}
out.end()

console.log(
  `\nParsed ${framerMessages.length - skipped} signups → ${byEmail.size} unique.` +
  (skipped > 0 ? ` (${skipped} skipped)` : "")
)
console.log(`Wrote: ${OUT_FILE}`)
