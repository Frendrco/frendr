import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: commentId } = await params
  const { value } = await req.json() as { value: 1 | -1 }

  const existing = await prisma.commentVote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId } },
  })

  if (existing) {
    if (existing.value === value) {
      await prisma.commentVote.delete({ where: { id: existing.id } })
      await prisma.comment.update({ where: { id: commentId }, data: { voteCount: { decrement: value } } })
    } else {
      await prisma.commentVote.update({ where: { id: existing.id }, data: { value } })
      await prisma.comment.update({ where: { id: commentId }, data: { voteCount: { increment: value * 2 } } })
    }
  } else {
    await prisma.commentVote.create({ data: { userId: user.id, commentId, value } })
    await prisma.comment.update({ where: { id: commentId }, data: { voteCount: { increment: value } } })
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { voteCount: true } })
  return NextResponse.json(comment)
}
