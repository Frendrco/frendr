import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"]

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { emoji } = await req.json()
  if (!ALLOWED_EMOJIS.includes(emoji)) return NextResponse.json({ error: "Invalid emoji" }, { status: 400 })

  const existing = await prisma.commentReaction.findUnique({
    where: { commentId_userId_emoji: { commentId: id, userId: user.id, emoji } },
  })

  if (existing) {
    await prisma.commentReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.commentReaction.create({ data: { commentId: id, userId: user.id, emoji } })
  }

  const [allReactions, userReactions] = await Promise.all([
    prisma.commentReaction.groupBy({
      by: ["emoji"],
      where: { commentId: id },
      _count: { emoji: true },
    }),
    prisma.commentReaction.findMany({
      where: { commentId: id, userId: user.id },
      select: { emoji: true },
    }),
  ])

  const userEmojiSet = new Set(userReactions.map(r => r.emoji))
  return NextResponse.json(
    allReactions.map(r => ({ emoji: r.emoji, count: r._count.emoji, reacted: userEmojiSet.has(r.emoji) }))
  )
}
