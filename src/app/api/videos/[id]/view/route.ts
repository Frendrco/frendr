import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  const { id } = await params

  const video = await prisma.video.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  })

  return NextResponse.json({ viewCount: video.viewCount })
}
