import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  })

  const conversations = participations.map((p) => {
    const other = p.conversation.participants.find((cp) => cp.userId !== user.id)
    const lastMessage = p.conversation.messages[0] ?? null
    const unreadCount = lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt) ? 1 : 0
    return {
      id: p.conversation.id,
      updatedAt: p.conversation.updatedAt,
      other: other?.user ?? null,
      lastMessage,
      unreadCount,
    }
  })

  return NextResponse.json(conversations)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { recipientId } = await req.json()
  if (!recipientId || recipientId === user.id) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 })
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } })
  if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 })

  // Find existing 1:1 conversation between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      participants: { every: { userId: { in: [user.id, recipientId] } } },
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: recipientId } } },
      ],
    },
    include: { participants: true },
  })

  // Only return it if it's exactly a 2-person conversation
  if (existing && existing.participants.length === 2) {
    return NextResponse.json({ id: existing.id })
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: user.id }, { userId: recipientId }],
      },
    },
  })

  return NextResponse.json({ id: conversation.id }, { status: 201 })
}
