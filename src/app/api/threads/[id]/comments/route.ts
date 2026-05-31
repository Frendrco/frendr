import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: threadId } = await params
  const { body, parentCommentId } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      userId: user.id,
      threadId,
      parentCommentId: parentCommentId ?? null,
    },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      replies: {
        include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
      },
    },
  })

  // Notify thread author (unless they're the commenter)
  const thread = await prisma.thread.findUnique({ where: { id: threadId }, select: { userId: true } })
  if (thread && thread.userId !== user.id) {
    createNotification({
      userId: thread.userId,
      type: parentCommentId ? "reply" : "comment",
      fromUserId: user.id,
      contentId: threadId,
      contentType: "thread",
    }).catch(() => {})
  }

  // If a reply, also notify the parent comment author (if different from thread author and commenter)
  if (parentCommentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentCommentId }, select: { userId: true } })
    if (parent && parent.userId !== user.id && parent.userId !== thread?.userId) {
      createNotification({
        userId: parent.userId,
        type: "reply",
        fromUserId: user.id,
        contentId: threadId,
        contentType: "thread",
      }).catch(() => {})
    }
  }

  return NextResponse.json(comment, { status: 201 })
}
