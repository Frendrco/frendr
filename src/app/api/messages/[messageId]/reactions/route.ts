import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ messageId: string }> }

async function getAuthedUser(clerkId: string | null) {
  if (!clerkId) return null
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
}

export async function POST(req: Request, { params }: Params) {
  const { messageId } = await params
  const { userId: clerkId } = await auth()
  const user = await getAuthedUser(clerkId ?? null)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { emoji } = await req.json()
  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "emoji is required" }, { status: 400 })
  }

  await prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId: user.id, emoji } },
    create: { messageId, userId: user.id, emoji },
    update: {},
  })

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(req: Request, { params }: Params) {
  const { messageId } = await params
  const { userId: clerkId } = await auth()
  const user = await getAuthedUser(clerkId ?? null)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { emoji } = await req.json()
  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "emoji is required" }, { status: 400 })
  }

  await prisma.messageReaction.deleteMany({
    where: { messageId, userId: user.id, emoji },
  })

  return new NextResponse(null, { status: 204 })
}
