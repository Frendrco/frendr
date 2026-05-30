import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST /api/playlists/watch-later — toggle video in Watch Later (auto-creates playlist)
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { videoId } = await req.json()
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 })

  // Find or create Watch Later playlist
  let watchLater = await prisma.playlist.findFirst({
    where: { userId: user.id, isDefault: true },
  })
  if (!watchLater) {
    watchLater = await prisma.playlist.create({
      data: { name: "Watch Later", isDefault: true, isPublic: false, userId: user.id },
    })
  }

  // Toggle: remove if exists, add if not
  const existing = await prisma.playlistVideo.findUnique({
    where: { playlistId_videoId: { playlistId: watchLater.id, videoId } },
  })

  if (existing) {
    await prisma.playlistVideo.delete({
      where: { playlistId_videoId: { playlistId: watchLater.id, videoId } },
    })
    return NextResponse.json({ added: false })
  } else {
    await prisma.playlistVideo.create({
      data: { playlistId: watchLater.id, videoId },
    })
    return NextResponse.json({ added: true })
  }
}
