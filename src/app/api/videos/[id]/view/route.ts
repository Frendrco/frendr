import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const video = await prisma.video.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  })

  return NextResponse.json({ viewCount: video.viewCount })
}
