import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getVideoThumbnail } from "@/lib/videoEmbed"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json() as {
    streamId?:      string
    externalUrl?:   string
    title:          string
    description?:   string
    tags?:          string[]
    isPublic?:      boolean
    thumbnailUrl?:  string
    collaborators?: { userId: string; role?: string | null }[]
  }

  const { streamId, externalUrl, title, description, tags, thumbnailUrl, collaborators } = body

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 })
  if (!streamId && !externalUrl) {
    return NextResponse.json({ error: "streamId or externalUrl is required" }, { status: 400 })
  }

  const resolvedThumbnail = thumbnailUrl
    ?? (streamId     ? `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg` : null)
    ?? (externalUrl  ? getVideoThumbnail(externalUrl) : null)

  try {
    const video = await prisma.video.create({
      data: {
        streamId:    streamId    ?? null,
        externalUrl: externalUrl ?? null,
        title,
        description: description ?? null,
        tags:        tags        ?? [],
        thumbnailUrl: resolvedThumbnail ?? null,
        userId: user.id,
      },
    })

    if (collaborators?.length) {
      await prisma.videoCollaborator.createMany({
        data: collaborators.map(({ userId, role }) => ({ videoId: video.id, userId, role: role ?? null })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(video, { status: 201 })
  } catch (err) {
    console.error("[POST /api/videos]", err)
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 })
  }
}
