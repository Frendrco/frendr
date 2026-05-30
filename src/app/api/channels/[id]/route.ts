import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

async function getAuthorizedChannel(clerkId: string, channelId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, role: true } })
  if (!user) return null

  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) return null

  const isOwner = channel.userId === user.id
  const isAdmin = user.role === "admin"
  if (!isOwner && !isAdmin) return null

  return { user, channel }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ctx = await getAuthorizedChannel(clerkId, id)
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, description, isPublic, coverUrl } = await req.json()
  const updated = await prisma.channel.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
      ...(coverUrl !== undefined && { coverUrl }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ctx = await getAuthorizedChannel(clerkId, id)
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.channel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
