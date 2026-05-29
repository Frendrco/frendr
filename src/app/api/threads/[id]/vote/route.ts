import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: threadId } = await params
  const { value } = await req.json() as { value: 1 | -1 }

  const existing = await prisma.threadVote.findUnique({
    where: { userId_threadId: { userId: user.id, threadId } },
  })

  if (existing) {
    if (existing.value === value) {
      await prisma.threadVote.delete({ where: { id: existing.id } })
      await prisma.thread.update({ where: { id: threadId }, data: { voteCount: { decrement: value } } })
    } else {
      await prisma.threadVote.update({ where: { id: existing.id }, data: { value } })
      await prisma.thread.update({ where: { id: threadId }, data: { voteCount: { increment: value * 2 } } })
    }
  } else {
    await prisma.threadVote.create({ data: { userId: user.id, threadId, value } })
    await prisma.thread.update({ where: { id: threadId }, data: { voteCount: { increment: value } } })
  }

  const thread = await prisma.thread.findUnique({ where: { id: threadId }, select: { voteCount: true } })
  return NextResponse.json(thread)
}
