import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await prisma.videoLike.findUnique({
    where: { videoId_userId: { videoId: id, userId: user.id } },
  })

  if (existing) {
    await prisma.videoLike.delete({ where: { id: existing.id } })
  } else {
    await prisma.videoLike.create({ data: { videoId: id, userId: user.id } })
  }

  const count = await prisma.videoLike.count({ where: { videoId: id } })
  return NextResponse.json({ liked: !existing, count })
}
