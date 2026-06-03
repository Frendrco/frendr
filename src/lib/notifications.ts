import { prisma } from "@/lib/prisma"

type NotificationType = "follow" | "comment" | "reply" | "message" | "vote" | "announcement"

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
  return notif
}

async function enqueueEmail(params: CreateParams) {
  if (params.type === "vote" || params.type === "announcement") return

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
