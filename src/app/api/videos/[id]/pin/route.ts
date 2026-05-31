import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, pinnedVideoId: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const video = await prisma.video.findUnique({ where: { id }, select: { userId: true } })
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (video.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const pinned = user.pinnedVideoId !== id
  await prisma.user.update({
    where: { id: user.id },
    data: { pinnedVideoId: pinned ? id : null },
  })

  return NextResponse.json({ pinned })
}
