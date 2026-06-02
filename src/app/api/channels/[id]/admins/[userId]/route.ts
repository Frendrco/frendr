import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, userId } = await params

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const channel = await prisma.channel.findUnique({ where: { id } })
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (channel.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.channelAdmin.deleteMany({ where: { channelId: id, userId } })
  return NextResponse.json({ ok: true })
}
