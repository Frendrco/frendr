import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

async function getOwnerContext(clerkId: string, channelId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } })
  if (!user) return null

  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) return null

  const isOwner = channel.userId === user.id
  if (!isOwner && !user.isAdmin) return null

  return { user, channel }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ctx = await getOwnerContext(clerkId, id)
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const admins = await prisma.channelAdmin.findMany({
    where: { channelId: id },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(admins.map((a) => a.user))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ctx = await getOwnerContext(clerkId, id)
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  if (userId === ctx.user.id) return NextResponse.json({ error: "Owner is already an admin" }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, displayName: true, avatarUrl: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.channelAdmin.upsert({
    where: { channelId_userId: { channelId: id, userId } },
    create: { channelId: id, userId },
    update: {},
  })

  return NextResponse.json(target)
}
