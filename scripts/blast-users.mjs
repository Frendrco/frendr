/**
 * Campaign email blast to all registered Frendr users.
 *
 * Usage:
 *   node --env-file=.env.local scripts/blast-users.mjs --dry-run  # preview only
 *   node --env-file=.env.local scripts/blast-users.mjs            # send
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { Resend } from "resend"

// ─── Edit these before sending ───────────────────────────────────────────────

const SUBJECT = "Here's what's been added to Frendr"

const HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#F1ECE9;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE9;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#5CE65C;padding:20px 32px;">
          <span style="font-size:18px;font-weight:700;color:#000;">frendr</span>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">Hey,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">I wanted to take a second to share what's new on Frendr and say a proper hello to everyone who signed up and hasn't had a chance to explore yet.</p>
          <p style="margin:0;font-size:15px;color:#444;line-height:1.7;">Here's what's been added.</p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td></tr>

        <!-- Features -->
        <tr><td style="padding:24px 32px 0;">

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Desktop app</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Frendr now has a desktop app and it's a noticeably better experience than the browser. Faster, cleaner, and it supports push notifications so you actually know when something happens on your account. Install it in seconds at <a href="https://frendr.co/download" style="color:#000;font-weight:600;">frendr.co/download</a>. No App Store, no waiting.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Vibes</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Your profile now has a Vibes section. Let people know what you're into, what you can't stand, and whether you're the kind of person who puts pineapple on pizza. It's the stuff that makes a profile feel like a person.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Drag to upload</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">You can now drag multiple videos straight from your desktop and upload them all at once. Drop your whole back catalogue in one go.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Import from YouTube, Vimeo, Framerate, or Dropbox — up to 10 at a time</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Already have work on other platforms? Paste up to 10 links at once and Frendr pulls in the thumbnails and descriptions automatically. Got videos sitting in Dropbox? Paste the share link, add a thumbnail and title, and it's live. No re-uploading, no compression.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Cleaner share links</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Slugs are cleaned up across the platform. When you share a link to your profile or a video, it actually looks good — no random strings of characters. Worth putting in your bio.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Hosting and embeds</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Upload a video and you get a clean, fast embed you can drop anywhere — your site, a client presentation, wherever. Privacy controls work the way you'd expect: public, followers only, or private with a password. You can host up to 20 mins of video for free before a small paywall. That's 40 × 30 second videos!</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Recess</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">You know the stuff you post on Instagram — the experiments. That's Recess. Same energy, except you're not handing it to Zuckerberg.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Featured Channels</p>
          <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.7;">We're launching a handful of channels dedicated to work that deserves its own spotlight.</p>
          <p style="margin:0 0 6px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:700;color:#111;">She Moves</span> — A channel dedicated to women in motion design, animation, and VFX. If you make work or know someone who does, submit it. This one matters.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:700;color:#111;">Animation for a Cause</span> — Motion work made in service of something bigger. Advocacy, awareness, community. If your work has a message behind it, this is where it lives.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">More channels coming. If you have an idea for one, reply and tell us.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Video cover on your profile</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Instead of a static image at the top of your page, your motion work does the talking from the moment someone lands on it.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Custom avatars</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">We're working with illustrator Justyna Stasik to replace placeholder images across the platform with a set of custom avatars. The plan is to rotate in a new illustrator every couple of months — so there's always a fresh creative voice baked into the platform.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Frendr School <span style="font-weight:400;color:#999;">(coming soon)</span></p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">A home for tutorials, tips, and introductions to teachers and courses from around the world. Teachers can link directly to their Patreon or courses — Frendr won't get in the way of that. More soon.</p>

          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">Security</p>
          <p style="margin:0 0 0;font-size:14px;color:#555;line-height:1.7;">We've put a lot of work into this behind the scenes. Hardened headers, validated inputs, protected uploads. Your work is safe here and your account is locked down.</p>

        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td></tr>

        <!-- Closing -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">If you haven't uploaded your first video yet — now's a good time. It doesn't have to be your best work. It just has to be yours.</p>
        </td></tr>

        <!-- CTAs -->
        <tr><td style="padding:0 32px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:10px;">
                <a href="https://frendr.co/dashboard/upload" style="display:inline-block;background:#5CE65C;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Upload a video →</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:10px;">
                <a href="https://frendr.co/dashboard/settings" style="display:inline-block;background:#F1ECE9;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Complete your profile →</a>
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://frendr.co/download" style="display:inline-block;background:#F1ECE9;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Get the app →</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Closing note -->
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Frendr is meant to be the one-stop hub for everything motion — the portfolio, the experiments, the learning, the community. If you know someone who should be here, send them the link. Word of mouth is how this grows. Or if you want to be a part of the community initiative, let me know.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Thanks for being here. More to come.</p>
          <!-- Signature -->
          <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr><td style="padding-bottom:12px;">
              <img src="https://frendr.co/images/icon-192.png" alt="Frendr" width="36" height="36" style="display:block;border-radius:8px;" />
            </td></tr>
            <tr><td>
              <p style="margin:0;font-size:14px;font-weight:700;color:#111;">Ryan Rumbolt</p>
              <p style="margin:2px 0 10px;font-size:13px;color:#888;">Founder &amp; Creative Director // Frendr</p>
              <p style="margin:0;font-size:13px;color:#555;">Creative community &amp; video hosting. Reunited. &nbsp;|&nbsp; <a href="https://frendr.co" style="color:#111;text-decoration:none;">frendr.co</a></p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">
            You're receiving this because you have an account on <a href="https://frendr.co" style="color:#999;">frendr.co</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run")
const TEST_ARG = process.argv.find((a) => a.startsWith("--test="))
const TEST_EMAIL = TEST_ARG ? TEST_ARG.split("=")[1] : null
const DELAY_MS = 500 // 2 sends/sec — safe within Resend limits

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error("❌  RESEND_API_KEY is not set. Run with --env-file=.env.local")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const users = await prisma.user.findMany({
  where: { email: { not: null } },
  select: { email: true, displayName: true },
  orderBy: { createdAt: "asc" },
})
await prisma.$disconnect()
await pool.end()

const allRecipients = users.filter((u) => u.email)
const recipients = TEST_EMAIL
  ? [{ email: TEST_EMAIL, displayName: "Test" }]
  : allRecipients

if (recipients.length === 0) {
  console.error("❌  No users with email addresses found in the database.")
  process.exit(1)
}

if (TEST_EMAIL) console.log(`\n🧪  TEST MODE — sending only to ${TEST_EMAIL}`)
console.log(`\n📋  ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} found in database`)
console.log(`📧  Subject: ${SUBJECT}`)

if (DRY_RUN) {
  console.log("\n🔍  DRY RUN — no emails will be sent. Recipients:\n")
  recipients.forEach((u) => console.log(`  ${u.email}  (${u.displayName})`))
  console.log("\n✅  Preview done. Remove --dry-run to send.")
  process.exit(0)
}

console.log("\nSending…\n")

const resend = new Resend(apiKey)
let sent = 0
let failed = 0

for (const { email, displayName } of recipients) {
  try {
    await resend.emails.send({
      from: "Frendr <notifications@frendr.co>",
      to: email,
      subject: SUBJECT,
      html: HTML,
    })
    console.log(`  ✓ ${email}  (${displayName})`)
    sent++
  } catch (err) {
    console.error(`  ✗ ${email} — ${err.message}`)
    failed++
  }
  await new Promise((r) => setTimeout(r, DELAY_MS))
}

console.log(`\n🎉  Done. ${sent} sent, ${failed} failed.`)
