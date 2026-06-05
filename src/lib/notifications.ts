import { prisma } from "@/lib/prisma"
import { resend, FROM, buildFollowEmail, buildTrendingEmail } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"

type NotificationType = "follow" | "comment" | "reply" | "message" | "vote" | "announcement" | "trending"

type CreateParams = {
  userId: string
  type: NotificationType
  fromUserId?: string
  contentId?: string
  contentType?: string
  message?: string
}

export async function createNotification(params: CreateParams) {
  const notif = await prisma.notification.create({ data: params })
  enqueueEmail(params).catch(() => {})
  sendPush(params).catch(() => {})
  return notif
}

async function sendPush(params: CreateParams) {
  const actor = params.fromUserId
    ? await prisma.user.findUnique({
        where: { id: params.fromUserId },
        select: { displayName: true },
      })
    : null

  const name = actor?.displayName ?? "Someone"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

  let title = "Frendr"
  let body = "You have a new notification"
  let url = "/"

  switch (params.type) {
    case "message":
      title = `${name} sent you a message`
      body = "Tap to read it"
      url = `${appUrl}/messages`
      break
    case "follow":
      title = `${name} started following you`
      body = "Check out their profile"
      url = actor ? `${appUrl}/${(await prisma.user.findUnique({ where: { id: params.fromUserId! }, select: { username: true } }))?.username ?? ""}` : `${appUrl}/`
      break
    case "comment":
      title = `${name} commented on your post`
      body = "Tap to see the comment"
      url = params.contentType === "video" && params.contentId ? `${appUrl}/v/${params.contentId}` : `${appUrl}/community/${params.contentId ?? ""}`
      break
    case "reply":
      title = `${name} replied to your comment`
      body = "Tap to see the reply"
      url = params.contentType === "video" && params.contentId ? `${appUrl}/v/${params.contentId}` : `${appUrl}/community/${params.contentId ?? ""}`
      break
    case "announcement":
      title = "Announcement from Frendr"
      body = params.message ?? "New announcement"
      url = `${appUrl}/`
      break
    default:
      return
  }

  await sendPushToUser(params.userId, { title, body, url })
}

async function sendImmediateEmail(params: CreateParams) {
  if (!resend) return

  if (params.type === "follow") {
    const [recipient, actor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, displayName: true, emailNotifyFollows: true },
      }),
      params.fromUserId
        ? prisma.user.findUnique({
            where: { id: params.fromUserId },
            select: { displayName: true, username: true },
          })
        : null,
    ])
    if (!recipient?.email || !recipient.emailNotifyFollows || !actor) return
    const { subject, html } = buildFollowEmail(recipient.displayName, actor.displayName, actor.username)
    await resend.emails.send({ from: FROM, to: recipient.email, subject, html })
  }

  if (params.type === "trending") {
    const [recipient, video] = await Promise.all([
      prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, displayName: true, emailNotifyTrending: true },
      }),
      params.contentId
        ? prisma.video.findUnique({ where: { id: params.contentId }, select: { title: true } })
        : null,
    ])
    if (!recipient?.email || !recipient.emailNotifyTrending || !video) return
    const milestone = Number(params.message)
    const { subject, html } = buildTrendingEmail(recipient.displayName, video.title, milestone, params.contentId!)
    await resend.emails.send({ from: FROM, to: recipient.email, subject, html })
  }
}

async function enqueueEmail(params: CreateParams) {
  if (params.type === "vote" || params.type === "announcement") return

  if (params.type === "follow" || params.type === "trending") {
    return sendImmediateEmail(params)
  }

  const actor = params.fromUserId
    ? await prisma.user.findUnique({
        where: { id: params.fromUserId },
        select: { displayName: true, username: true },
      })
    : null

  await prisma.notificationQueue.create({
    data: {
      userId: params.userId,
      type: params.type,
      data: {
        actorName: actor?.displayName ?? "Someone",
        actorUsername: actor?.username ?? null,
        contentId: params.contentId ?? null,
        contentType: params.contentType ?? null,
      },
    },
  })
}
