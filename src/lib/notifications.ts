import { prisma } from "@/lib/prisma"
import { resend, FROM, APP_URL } from "@/lib/email"

type NotificationType = "follow" | "comment" | "reply" | "message" | "vote"

type CreateParams = {
  userId: string
  type: NotificationType
  fromUserId?: string
  contentId?: string
  contentType?: string
}

export async function createNotification(params: CreateParams) {
  const notif = await prisma.notification.create({ data: params })
  // Fire-and-forget — email failure never blocks the API response
  sendEmail(params).catch(() => {})
  return notif
}

async function sendEmail(params: CreateParams) {
  if (!resend) return
  if (params.type === "vote") return

  const [recipient, actor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        email: true,
        displayName: true,
        emailNotifyMessages: true,
        emailNotifyComments: true,
        emailNotifyReplies:  true,
        emailNotifyFollows:  true,
      },
    }),
    params.fromUserId
      ? prisma.user.findUnique({ where: { id: params.fromUserId }, select: { displayName: true, username: true } })
      : null,
  ])

  if (!recipient?.email) return

  const prefEnabled: Record<string, boolean> = {
    message: recipient.emailNotifyMessages,
    comment: recipient.emailNotifyComments,
    reply:   recipient.emailNotifyReplies,
    follow:  recipient.emailNotifyFollows,
  }
  if (prefEnabled[params.type] === false) return

  const actorName = actor?.displayName ?? "Someone"
  const { subject, html } = buildEmail(params.type, actorName, actor?.username, params.contentId)

  await resend.emails.send({ from: FROM, to: recipient.email, subject, html })
}

function buildEmail(
  type: NotificationType,
  actorName: string,
  actorUsername: string | undefined,
  contentId: string | undefined,
): { subject: string; html: string } {
  const profileUrl = actorUsername ? `${APP_URL}/${actorUsername}` : APP_URL

  const configs: Record<NotificationType, { subject: string; body: string; ctaLabel: string; ctaUrl: string }> = {
    follow: {
      subject: `${actorName} started following you`,
      body: `<strong>${actorName}</strong> started following you on Frendr.`,
      ctaLabel: "View their profile",
      ctaUrl: profileUrl,
    },
    comment: {
      subject: `${actorName} commented on your post`,
      body: `<strong>${actorName}</strong> left a comment on your post.`,
      ctaLabel: "See the comment",
      ctaUrl: contentId ? `${APP_URL}/community` : APP_URL,
    },
    reply: {
      subject: `${actorName} replied to your comment`,
      body: `<strong>${actorName}</strong> replied to your comment.`,
      ctaLabel: "See the reply",
      ctaUrl: contentId ? `${APP_URL}/community` : APP_URL,
    },
    message: {
      subject: `New message from ${actorName}`,
      body: `<strong>${actorName}</strong> sent you a message on Frendr.`,
      ctaLabel: "Read message",
      ctaUrl: `${APP_URL}/messages`,
    },
    vote: { subject: "", body: "", ctaLabel: "", ctaUrl: "" },
  }

  const { subject, body, ctaLabel, ctaUrl } = configs[type]

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
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:16px;color:#111;line-height:1.5;">${body}</p>
          <a href="${ctaUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">${ctaLabel}</a>
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
