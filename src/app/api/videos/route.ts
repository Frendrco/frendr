import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Saves a completed video record after the client finishes uploading to Cloudflare.
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const {
    streamId,
    title,
    description,
    tags,
    isPublic,
  } = await req.json() as {
    streamId: string
    title: string
    description?: string
    tags?: string[]
    isPublic?: boolean
  }

  if (!streamId || !title) {
    return NextResponse.json({ error: "streamId and title are required" }, { status: 400 })
  }

  const video = await prisma.video.create({
    data: {
      streamId,
      title,
      description:  description  ?? null,
      tags:         tags          ?? [],
      thumbnailUrl: `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg`,
      userId:       user.id,
    },
  })

  return NextResponse.json(video, { status: 201 })
}
