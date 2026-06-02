import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST /api/channels/[id]/videos — add a video to a channel
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: channelId } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = channel.userId === user.id
  const isSiteAdmin = user.isAdmin
  const isChannelAdmin = !isOwner && !isSiteAdmin
    ? !!(await prisma.channelAdmin.findUnique({ where: { channelId_userId: { channelId, userId: user.id } } }))
    : false
  if (!isOwner && !isSiteAdmin && !isChannelAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 })

  const entry = await prisma.channelVideo.upsert({
    where: { channelId_videoId: { channelId, videoId } },
    create: { channelId, videoId, addedBy: user.id },
    update: {},
  })

  return NextResponse.json(entry, { status: 201 })
}
