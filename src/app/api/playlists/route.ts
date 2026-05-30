import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// GET /api/playlists?videoId=xxx — returns user's playlists with hasVideo flag
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const videoId = req.nextUrl.searchParams.get("videoId")

  const playlists = await prisma.playlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      videos: videoId
        ? { where: { videoId }, select: { videoId: true } }
        : { select: { videoId: true }, take: 0 },
    },
  })

  return NextResponse.json(
    playlists.map((p) => ({
      id: p.id,
      name: p.name,
      isPublic: p.isPublic,
      isDefault: p.isDefault,
      hasVideo: videoId ? p.videos.some((v) => v.videoId === videoId) : false,
    }))
  )
}

// POST /api/playlists — create a new playlist
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, description, isPublic } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const playlist = await prisma.playlist.create({
    data: { name: name.trim(), description, isPublic: Boolean(isPublic), userId: user.id },
  })

  return NextResponse.json(playlist, { status: 201 })
}
