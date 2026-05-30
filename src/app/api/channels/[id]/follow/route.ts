import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST /api/channels/[id]/follow — toggle follow
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: channelId } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await prisma.channelFollow.findUnique({
    where: { channelId_userId: { channelId, userId: user.id } },
  })

  if (existing) {
    await prisma.channelFollow.delete({
      where: { channelId_userId: { channelId, userId: user.id } },
    })
    return NextResponse.json({ following: false })
  } else {
    await prisma.channelFollow.create({ data: { channelId, userId: user.id } })
    return NextResponse.json({ following: true })
  }
}
