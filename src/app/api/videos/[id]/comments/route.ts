import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const likedByInclude = {
  take: 10,
  orderBy: { createdAt: "asc" as const },
  include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
}

const commentInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  likes: likedByInclude,
  reactions: true,
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      likes: likedByInclude,
      reactions: true,
    },
  },
}

function buildReactions(reactions: { emoji: string; userId: string }[], currentUserId?: string) {
  const map = new Map<string, { emoji: string; count: number; reacted: boolean }>()
  for (const r of reactions) {
    const ex = map.get(r.emoji)
    if (ex) {
      ex.count++
      if (r.userId === currentUserId) ex.reacted = true
    } else {
      map.set(r.emoji, { emoji: r.emoji, count: 1, reacted: r.userId === currentUserId })
    }
  }
  return Array.from(map.values())
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
    userVote: 0 as const,
    likeCount: c.likes.length,
    liked: c.likes.some(l => l.userId === currentUser?.id),
    likedBy: c.likes.map(l => l.user),
    reactions: buildReactions(c.reactions, currentUser?.id),
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userVote: 0 as const,
      likeCount: r.likes.length,
      liked: r.likes.some(l => l.userId === currentUser?.id),
      likedBy: r.likes.map(l => l.user),
      reactions: buildReactions(r.reactions, currentUser?.id),
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

  const videoCheck = await prisma.video.findUnique({ where: { id }, select: { allowComments: true } })
  if (!videoCheck?.allowComments) {
    return NextResponse.json({ error: "Comments are disabled for this video" }, { status: 403 })
  }

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
    likeCount: 0,
    liked: false,
    likedBy: [],
    reactions: [],
    replies: [],
  }, { status: 201 })
}
