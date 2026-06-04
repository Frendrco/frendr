import { Resend } from "resend"

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const FROM = "Frendr <notifications@frendr.co>"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"

type DigestItem = {
  type: string
  data: {
    actorName: string
    actorUsername: string | null
    contentId: string | null
    contentType: string | null
  }
}

export function buildDigestEmail(recipientName: string, items: DigestItem[]): { subject: string; html: string } {
  const counts = { follow: 0, message: 0, comment: 0, reply: 0 }
  for (const item of items) {
    if (item.type in counts) counts[item.type as keyof typeof counts]++
  }

  const follows  = items.filter(i => i.type === "follow")
  const messages = items.filter(i => i.type === "message")
  const comments = items.filter(i => i.type === "comment")
  const replies  = items.filter(i => i.type === "reply")

  const total = items.length
  const subject = `You have ${total} new notification${total === 1 ? "" : "s"} on Frendr`

  function nameList(group: DigestItem[]): string {
    const names = [...new Set(group.map(i => `<strong>${i.data.actorName}</strong>`))].slice(0, 3)
    if (names.length === 0) return ""
    if (names.length === 1) return names[0]
    const rest = group.length - 3
    const base = names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
    return rest > 0 ? `${base} and ${rest} more` : base
  }

  function section(emoji: string, heading: string, group: DigestItem[]): string {
    if (group.length === 0) return ""
    return `
      <tr><td style="padding:12px 32px 0;">
        <p style="margin:0;font-size:15px;color:#111;line-height:1.5;">
          ${emoji}&nbsp; ${nameList(group)} ${heading}
        </p>
      </td></tr>`
  }

  const rows = [
    section("👋", `started following you`, follows),
    section("✉️", `sent you a message`, messages),
    section("💬", `commented on your post`, comments),
    section("↩️", `replied to your comment`, replies),
  ].filter(Boolean).join("")

  const html = `<!DOCTYPE html>
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
          <p style="margin:0;font-size:16px;font-weight:600;color:#111;">Hi ${recipientName},</p>
          <p style="margin:8px 0 0;font-size:14px;color:#666;">Here's what happened while you were away.</p>
        </td></tr>
        ${rows}
        <tr><td style="padding:28px 32px 32px;">
          <a href="${APP_URL}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">Visit Frendr →</a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">You're receiving this daily digest because you have an account on Frendr. <a href="${APP_URL}/dashboard/settings" style="color:#999;">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export function buildFollowEmail(recipientName: string, actorName: string, actorUsername: string): { subject: string; html: string } {
  const subject = `${actorName} started following you on Frendr`
  const html = `<!DOCTYPE html>
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
          <p style="margin:0;font-size:16px;font-weight:600;color:#111;">Hi ${recipientName},</p>
        </td></tr>
        <tr><td style="padding:12px 32px 0;">
          <p style="margin:0;font-size:15px;color:#111;line-height:1.5;">
            👋&nbsp; <strong>${actorName}</strong> started following you.
          </p>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <a href="${APP_URL}/${actorUsername}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">View their profile →</a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">You're receiving this because you have an account on Frendr. <a href="${APP_URL}/dashboard/settings" style="color:#999;">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html }
}

export function buildTrendingEmail(recipientName: string, videoTitle: string, milestone: number, videoId: string): { subject: string; html: string } {
  const subject = `Your video just hit ${milestone.toLocaleString()} views on Frendr`
  const html = `<!DOCTYPE html>
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
          <p style="margin:0;font-size:16px;font-weight:600;color:#111;">Hi ${recipientName},</p>
        </td></tr>
        <tr><td style="padding:12px 32px 0;">
          <p style="margin:0;font-size:15px;color:#111;line-height:1.5;">
            🔥&nbsp; <strong>${videoTitle}</strong> just hit <strong>${milestone.toLocaleString()} views</strong>. Nice work!
          </p>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <a href="${APP_URL}/v/${videoId}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">View your video →</a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">You're receiving this because you have an account on Frendr. <a href="${APP_URL}/dashboard/settings" style="color:#999;">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html }
}
