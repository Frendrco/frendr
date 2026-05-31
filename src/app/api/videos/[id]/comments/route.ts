import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

const commentInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  votes: true,
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      votes: true,
    },
  },
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkId } = await auth()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  const comments = await prisma.comment.findMany({
    where: { videoId: id, parentCommentId: null },
    orderBy: { createdAt: "asc" },
    include: commentInclude,
  })

  const serialized = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    userVote: currentUser
      ? (c.votes.find((v) => v.userId === currentUser.id)?.value ?? 0) as 1 | -1 | 0
      : 0 as const,
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userVote: currentUser
        ? (r.votes.find((v) => v.userId === currentUser.id)?.value ?? 0) as 1 | -1 | 0
        : 0 as const,
    })),
  }))

  return NextResponse.json(serialized)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { body, parentCommentId } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 })

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      userId: user.id,
      videoId: id,
      parentCommentId: parentCommentId ?? null,
    },
    include: commentInclude,
  })

  return NextResponse.json({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    userVote: 0,
    replies: comment.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userVote: 0,
    })),
  }, { status: 201 })
}
