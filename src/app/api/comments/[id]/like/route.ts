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

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: id, userId: user.id } },
  })

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } })
  } else {
    await prisma.commentLike.create({ data: { commentId: id, userId: user.id } })
  }

  const [count, likedBy] = await Promise.all([
    prisma.commentLike.count({ where: { commentId: id } }),
    prisma.commentLike.findMany({
      where: { commentId: id },
      take: 10,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
    }),
  ])

  return NextResponse.json({ liked: !existing, count, likedBy: likedBy.map(l => l.user) })
}
