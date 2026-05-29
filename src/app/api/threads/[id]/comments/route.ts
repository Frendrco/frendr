import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  return NextResponse.json(comment, { status: 201 })
}
