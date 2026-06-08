import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const commentInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
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

  // Fetch current user's votes in one query instead of loading all votes
  const allIds = [
    ...comments.map(c => c.id),
    ...comments.flatMap(c => c.replies.map(r => r.id)),
  ]
  const userVotes = currentUser && allIds.length > 0
    ? await prisma.commentVote.findMany({
        where: { userId: currentUser.id, commentId: { in: allIds } },
        select: { commentId: true, value: true },
      })
    : []
  const voteMap = new Map(userVotes.map(v => [v.commentId, v.value]))

  const serialized = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    userVote: (voteMap.get(c.id) ?? 0) as 1 | -1 | 0,
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userVote: (voteMap.get(r.id) ?? 0) as 1 | -1 | 0,
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
  if (body.trim().length > 2000) return NextResponse.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 })

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      userId: user.id,
      videoId: id,
      parentCommentId: parentCommentId ?? null,
    },
    include: commentInclude,
  })

  // Fetch video owner + parent comment author in parallel
  const [video, parent] = await Promise.all([
    prisma.video.findUnique({ where: { id }, select: { userId: true } }),
    parentCommentId
      ? prisma.comment.findUnique({ where: { id: parentCommentId }, select: { userId: true } })
      : Promise.resolve(null),
  ])

  if (video && video.userId !== user.id) {
    createNotification({
      userId: video.userId,
      type: parentCommentId ? "reply" : "comment",
      fromUserId: user.id,
      contentId: id,
      contentType: "video",
    }).catch(() => {})
  }

  if (parent && parent.userId !== user.id && parent.userId !== video?.userId) {
    createNotification({
      userId: parent.userId,
      type: "reply",
      fromUserId: user.id,
      contentId: id,
      contentType: "video",
    }).catch(() => {})
  }

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
