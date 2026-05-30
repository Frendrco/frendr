import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// GET /api/channels/[id]/video-search?q= — search all videos, annotated with inChannel
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: channelId } = await params
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q) return NextResponse.json([])

  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { user: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true } },
      channels: { where: { channelId }, select: { videoId: true } },
    },
  })

  return NextResponse.json(
    videos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      user: { displayName: v.user.displayName },
      inChannel: v.channels.length > 0,
    }))
  )
}
