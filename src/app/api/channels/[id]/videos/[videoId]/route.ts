import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/channels/[id]/videos/[videoId] — remove a video from a channel
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: channelId, videoId } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = channel.userId === user.id
  const isAdmin = user.isAdmin
  const isChannelAdmin = !isOwner && !isAdmin
    ? !!(await prisma.channelAdmin.findUnique({ where: { channelId_userId: { channelId, userId: user.id } } }))
    : false
  if (!isOwner && !isAdmin && !isChannelAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.channelVideo.deleteMany({ where: { channelId, videoId } })
  return NextResponse.json({ ok: true })
}
