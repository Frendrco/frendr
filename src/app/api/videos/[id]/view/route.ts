import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

const MILESTONES = new Set([100, 500, 1000, 5000, 10000])

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  const { id } = await params

  const video = await prisma.video.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true, userId: true, title: true },
  })

  if (MILESTONES.has(video.viewCount)) {
    createNotification({
      userId:      video.userId,
      type:        "trending",
      contentId:   id,
      contentType: "video",
      message:     String(video.viewCount),
    }).catch(() => {})
  }

  return NextResponse.json({ viewCount: video.viewCount })
}
