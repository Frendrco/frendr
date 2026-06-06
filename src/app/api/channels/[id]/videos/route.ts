import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

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

  const existing = await prisma.channelVideo.findUnique({ where: { channelId_videoId: { channelId, videoId } } })

  const entry = await prisma.channelVideo.upsert({
    where: { channelId_videoId: { channelId, videoId } },
    create: { channelId, videoId, addedBy: user.id },
    update: {},
  })

  // Notify the video owner if it's a new add and they're not the one doing it
  if (!existing) {
    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { userId: true } })
    if (video && video.userId !== user.id) {
      createNotification({
        userId: video.userId,
        type: "channel_add",
        fromUserId: user.id,
        contentId: videoId,
        contentType: "video",
        message: JSON.stringify({ channelName: channel.name, channelSlug: channel.slug }),
      }).catch(() => {})
    }
  }

  return NextResponse.json(entry, { status: 201 })
}
