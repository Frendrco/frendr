import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const SENDER_EMAIL = "ryan@wonderlustmedia.ca"

export async function sendWelcomeMessage(toUser: { id: string; displayName: string }) {
  const sender = await prisma.user.findFirst({ where: { email: SENDER_EMAIL }, select: { id: true } })
  if (!sender || sender.id === toUser.id) return

  // Idempotent — skip if a conversation already exists between these two
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: sender.id } } },
        { participants: { some: { userId: toUser.id } } },
      ],
    },
    include: { participants: { select: { userId: true } } },
  })
  if (existing && existing.participants.length === 2) return

  const body = `Hey ${toUser.displayName}, welcome to Frendr. We're in beta right now, which means your feedback actually shapes the product. The best thing you can do is upload a piece of work — it helps us catch bugs and test the full experience. Takes two minutes and makes a real difference. Thanks for being here early.`

  const conversation = await prisma.$transaction(async (tx) => {
    const convo = await tx.conversation.create({
      data: {
        participants: {
          create: [{ userId: sender.id }, { userId: toUser.id }],
        },
      },
    })
    await tx.message.create({
      data: { conversationId: convo.id, senderId: sender.id, body },
    })
    return convo
  })

  createNotification({
    userId: toUser.id,
    type: "message",
    fromUserId: sender.id,
    contentId: conversation.id,
    contentType: "conversation",
  }).catch(() => {})
}
