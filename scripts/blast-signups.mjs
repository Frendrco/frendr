/**
 * Launch email blast to Framer form submissions.
 *
 * Usage:
 *   node --env-file=.env.local scripts/blast-signups.mjs --test=you@example.com   # test only
 *   node --env-file=.env.local scripts/blast-signups.mjs                          # send to all
 *
 * Excluded by default: beatgram@gamil.com (typo dupe), me@justincone.com, justin.cone@buck.co
 */

import { readFileSync } from "fs"
import { Resend } from "resend"

// ─── Edit these before sending ───────────────────────────────────────────────

const SUBJECT = "frendr is live."

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
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111;line-height:1.3;">We took our time with this one.</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">A lot has been happening in this space and I wanted to make sure Frendr wasn't just another version of something that already existed. So we paused, watched, and built something different. I can honestly say we did.</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">I've had an idea in my head for years about what a community platform for this industry should look like. This is it. Frendr. Or as we like to call it, friends who render.</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">Frendr is my way of giving something back to a community that has given me so much over the years. It's free, it's inclusive, and it's built around the people behind the work, not just the work itself. We want to know who you are, not just what your reel looks like.</p>
          <p style="margin:0 0 0;font-size:15px;color:#444;line-height:1.7;">I would've done a walkthrough video but I hate the sound of my own voice, so here's everything in writing instead. Or you can skip reading and just try it.</p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td></tr>

        <!-- Sections -->
        <tr><td style="padding:24px 32px 0;">

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Your profile</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Your profile is your whole creative world in one place. Share your portfolio work, experiments, Rive work, and playlists. Add your music, link your Substack, your shop, your socials, whatever tells the full story of who you are and what you make. Tag your skills, set your work status, and fill in your Vibes. Let people know what you're into and whether you're a monster who loves pineapple on pizza.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Pin your best work to the top, shuffle your videos to keep things fresh, and set a video as your cover so your motion work is the first thing anyone sees. When you sign up you can personalise your feed based on the tools and disciplines you care about, so what you see is actually relevant to you. You can also choose whether or not AI work shows up in your feed. Your call.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Upload your work</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Host up to 20 minutes of video free. That's 40 × 30-second pieces, one short film, or whatever mix you choose. Upload multiple videos at once by dragging straight from your desktop, or import from Vimeo, YouTube, Framerate, and Dropbox. Paste up to 10 links at a time and Frendr automatically pulls in the thumbnails and titles for you. Imported content is always free, no matter how much you bring over.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Every video gets a clean, fast embed you can drop on your site or in a client presentation, with the same privacy controls you'd expect: public, followers only, or private with a password.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Recess &amp; Rive World</p>
          <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">Two spaces for the work that doesn't fit anywhere else.</p>
          <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Recess</span> is for everything you'd normally throw on Instagram. The Cavalry experiments, the quick loops, the tests that didn't quite become a project but were too good not to share. Tag your tools so people can find work made with the same software they're learning or curious about.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Rive World</span> is for your interactive work. If you're building in Rive, this is where it lives. Playable, explorable, and in front of an audience that actually gets it.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Community</p>
          <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">Everything the community needs, in one place.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Discussion board:</span> Mixed Parts energy, not LinkedIn. Talk about the work, ask questions, share the weird stuff. No thought leadership.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Jobs:</span> Post a job or find one. Whether you're hiring or available, this is where that happens.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Events:</span> Create and discover events in the motion community. Tag them as LGBTQ+ friendly so the right people can find them.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Shops:</span> Sell your assets, presets, or artwork directly from your profile. After Effects templates, Procreate brushes, prints. Add your shop and let people buy.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Featured Channels</p>
          <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">Curated collections built around the work and communities that matter. Frendr supports motion design, animation, VFX, 3D, interactive, and everything in between.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">She Moves:</span> Dedicated to women in motion design, animation, and VFX.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Animation for a Cause:</span> Motion work with a message behind it. Advocacy, awareness, community.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Cavalry:</span> A dedicated space for work made in Cavalry. If you're pushing the tool, this is where it belongs.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">More channels coming. If you have an idea for one, reply and tell us.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">The desktop app</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Get a faster, cleaner experience and stay on top of your account with push notifications. Install in seconds at <a href="https://frendr.co/download" style="color:#000;font-weight:600;">frendr.co/download</a>. No App Store, no waiting.</p>

          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111;">Coming soon</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Frendr School:</span> A home for tutorials, tips, and introductions to teachers and courses from around the world. Teachers can link directly to their Patreon, courses, or wherever their community lives. Frendr won't get in the way of that.</p>
          <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Custom avatars:</span> We're partnering with illustrators to create custom avatar sets for the platform, swapping in a new artist every couple of months. Always a fresh creative voice baked into Frendr.</p>
          <p style="margin:0 0 0;font-size:14px;color:#555;line-height:1.7;"><span style="font-weight:600;color:#111;">Frendr Live:</span> We're in the early stages of planning a conference in Lisbon. More on that soon.</p>

        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;" /></td></tr>

        <!-- Closing text -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">Frendr is a free community initiative, built for this industry by people who love it. If you know someone who wants to get involved, whether that's contributing, collaborating, or just helping spread the word, tell them to reach out.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">This is v01. Things will break, features will evolve, and your feedback genuinely shapes what comes next. If something feels off, reply and let me know. I read everything.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">A few things worth knowing: we don't sell your data, we don't run ads, and we never will. Privacy and security is baked in from the start.</p>
          <p style="margin:0 0 0;font-size:14px;color:#555;line-height:1.7;">And if you know a video creator who should be here, send them the link. Word of mouth is how this grows.</p>
        </td></tr>

        <!-- CTAs -->
        <tr><td style="padding:24px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:10px;">
                <a href="https://frendr.co/sign-up" style="display:inline-block;background:#5CE65C;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Create your profile →</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:10px;">
                <a href="https://frendr.co/dashboard/upload" style="display:inline-block;background:#F1ECE9;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Upload your first video →</a>
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://frendr.co/download" style="display:inline-block;background:#F1ECE9;color:#000;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Get the desktop app →</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Sign-off -->
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Thanks for being here. More to come.</p>
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
            You're receiving this because you expressed interest in <a href="https://frendr.co" style="color:#999;">frendr.co</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────

const EXCLUDE = new Set([
  "beatgram@gamil.com",     // typo duplicate of beatgram@gmail.com
  "me@justincone.com",      // user requested removal
  "justin.cone@buck.co",    // user requested removal (same person)
  ...process.argv
    .filter(a => a.startsWith("--exclude="))
    .flatMap(a => a.replace("--exclude=", "").split(","))
    .map(e => e.trim().toLowerCase()),
])

const TEST_ARG = process.argv.find(a => a.startsWith("--test="))
const TEST_EMAIL = TEST_ARG ? TEST_ARG.split("=")[1] : null
const DELAY_MS = 500

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error("❌  RESEND_API_KEY is not set. Run with --env-file=.env.local")
  process.exit(1)
}

// Parse CSV — email is always the first field (no quotes, no commas in emails)
const seen = new Set()
const allRecipients = readFileSync("frendr-signups.csv", "utf-8")
  .split("\n")
  .slice(1) // skip header
  .map(line => line.split(",")[0]?.trim().toLowerCase())
  .filter(email => email && email.includes("@") && !EXCLUDE.has(email))
  .filter(email => {
    if (seen.has(email)) return false
    seen.add(email)
    return true
  })

const recipients = TEST_EMAIL ? [TEST_EMAIL] : allRecipients

if (recipients.length === 0) {
  console.error("❌  No recipients found.")
  process.exit(1)
}

if (TEST_EMAIL) console.log(`\n🧪  TEST MODE — sending only to ${TEST_EMAIL}`)
console.log(`\n📋  ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`)
console.log(`📧  Subject: ${SUBJECT}\n`)

const resend = new Resend(apiKey)
let sent = 0
let failed = 0

for (const to of recipients) {
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
  await new Promise(r => setTimeout(r, DELAY_MS))
}

console.log(`\n🎉  Done. ${sent} sent, ${failed} failed.`)
