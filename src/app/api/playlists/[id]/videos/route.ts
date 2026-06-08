import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST /api/playlists/[id]/videos — add video to playlist
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 })

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { isPublic: true, userId: true },
  })
  if (!video || (!video.isPublic && video.userId !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const entry = await prisma.playlistVideo.upsert({
    where: { playlistId_videoId: { playlistId: id, videoId } },
    create: { playlistId: id, videoId },
    update: {},
  })

  return NextResponse.json(entry, { status: 201 })
}
