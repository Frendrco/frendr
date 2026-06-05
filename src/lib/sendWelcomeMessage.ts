import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const SENDER_EMAIL = "ryan@frendr.co"

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

  const body = `Hey ${toUser.displayName} - Welcome to Frendr!

A few things that make this place work:

Share the real stuff. Work in progress, passion projects, the stuff you actually care about. Not just the reel-ready highlights you'd send a client.

Be a person, not a brand. Comments, feedback, reactions go a long way. Show up for other people's work the way you want them to show up for yours.

Leave the ego at the door. Everyone here is at a different stage. That's the point.

We're in beta, so expect some rough edges. If something feels broken, tell me. If something feels right, tell me that too.

Glad you're here early. Ryan`

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
