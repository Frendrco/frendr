import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { videoId, thumbnailUrl } = await req.json()
  if (!videoId || !thumbnailUrl) return NextResponse.json({ error: "videoId and thumbnailUrl required" }, { status: 400 })

  const video = await prisma.video.update({
    where: { id: videoId },
    data: { thumbnailUrl },
    select: { id: true, title: true, thumbnailUrl: true },
  })

  return NextResponse.json(video)
}
