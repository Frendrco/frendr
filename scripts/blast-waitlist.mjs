/**
 * One-time waitlist blast script.
 *
 * Usage:
 *   node --env-file=.env.local scripts/blast-waitlist.mjs          # send
 *   node --env-file=.env.local scripts/blast-waitlist.mjs --dry-run # preview only
 *
 * Reads email addresses from the Notion export markdown file below.
 */

import { readFileSync } from "fs"
import { Resend } from "resend"

const NOTION_FILE = "/Users/wonderlust/Desktop/Private & Shared/Organized email list 2bd21f14375b8062b050e80208828f03.md"

// ─── Edit these before sending ───────────────────────────────────────────────

const SUBJECT = "You're invited to Frendr — the creative platform for motion designers"

const HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#F1ECE9;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE9;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#5CE65C;padding:20px 32px;">
          <span style="font-size:18px;font-weight:700;color:#000;">frendr</span>
        </td></tr>

        <tr><td style="padding:32px 32px 8px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#111;line-height:1.3;">
            You're in.
          </p>
          <p style="margin:16px 0 0;font-size:15px;color:#444;line-height:1.6;">
            Thanks for signing up — Frendr is now open. It's a place for motion designers,
            animators, and video creators to share work, discover what others are making,
            and connect with the people behind it.
          </p>
          <p style="margin:16px 0 0;font-size:15px;color:#444;line-height:1.6;">
            Come take a look. Upload something. See what's already there.
          </p>
        </td></tr>

        <tr><td style="padding:28px 32px 32px;">
          <a href="https://frendr.co/sign-up" style="display:inline-block;background:#5CE65C;color:#000;padding:13px 28px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">
            Create your profile →
          </a>
        </td></tr>

        <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">
            You're receiving this because you signed up for early access to Frendr.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run")
const DELAY_MS = 500 // 2 sends/sec — safe within Resend limits

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error("❌  RESEND_API_KEY is not set. Run with --env-file=.env.local")
  process.exit(1)
}

const md = readFileSync(NOTION_FILE, "utf-8")

// Pull every mailto: address from markdown links: [text](mailto:email)
const mailtoMatches = [...md.matchAll(/mailto:([^)>\s]+)/g)].map((m) => m[1])

// Also catch bare email addresses on their own line (loose entries at bottom of the file)
const bareMatches = md
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(l))

const emails = [
  ...new Set([...mailtoMatches, ...bareMatches].map((e) => e.toLowerCase().trim())),
].filter((e) => e.includes("@") && !e.includes("*"))

if (emails.length === 0) {
  console.error("❌  No email addresses found in the Notion file.")
  process.exit(1)
}

console.log(`\n📋  ${emails.length} recipient${emails.length === 1 ? "" : "s"} loaded`)
console.log(`📧  Subject: ${SUBJECT}`)

if (DRY_RUN) {
  console.log("\n🔍  DRY RUN — no emails will be sent. Recipients:\n")
  emails.forEach((e) => console.log(`  ${e}`))
  console.log("\n✅  Preview done. Remove --dry-run to send.")
  process.exit(0)
}

console.log("\nSending…\n")

const resend = new Resend(apiKey)
let sent = 0
let failed = 0

for (const to of emails) {
  try {
    await resend.emails.send({
      from: "Frendr <notifications@frendr.co>",
      to,
      subject: SUBJECT,
      html: HTML,
    })
    console.log(`  ✓ ${to}`)
    sent++
  } catch (err) {
    console.error(`  ✗ ${to} — ${err.message}`)
    failed++
  }
  await new Promise((r) => setTimeout(r, DELAY_MS))
}

console.log(`\n🎉  Done. ${sent} sent, ${failed} failed.`)
