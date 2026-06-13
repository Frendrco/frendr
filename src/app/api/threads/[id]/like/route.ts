import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await prisma.threadLike.findUnique({
    where: { threadId_userId: { threadId: id, userId: user.id } },
  })

  const [, likedBy] = await prisma.$transaction([
    existing
      ? prisma.threadLike.delete({ where: { id: existing.id } })
      : prisma.threadLike.create({ data: { threadId: id, userId: user.id } }),
    prisma.threadLike.findMany({
      where: { threadId: id },
      take: 10,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
    }),
  ])

  const count = await prisma.threadLike.count({ where: { threadId: id } })
  await prisma.thread.update({ where: { id }, data: { likeCount: count } })

  return NextResponse.json({
    liked: !existing,
    count,
    likedBy: (likedBy as Array<{ user: { username: string; displayName: string; avatarUrl: string | null } }>).map(l => l.user),
  })
}
