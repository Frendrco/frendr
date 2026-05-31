import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  })
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [messages, conversation] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
  ])

  return NextResponse.json({ messages, conversation })
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  })
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { body } = await req.json()
  const trimmed = body?.trim()
  if (!trimmed || trimmed.length > 2000) {
    return NextResponse.json({ error: "Message body is required (max 2000 chars)" }, { status: 400 })
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: id, senderId: user.id, body: trimmed },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ])

  // Notify all other participants
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { participants: { select: { userId: true } } },
  })
  for (const p of conversation?.participants ?? []) {
    if (p.userId !== user.id) {
      createNotification({
        userId: p.userId,
        type: "message",
        fromUserId: user.id,
        contentId: id,
        contentType: "conversation",
      }).catch(() => {})
    }
  }

  return NextResponse.json(message, { status: 201 })
}
