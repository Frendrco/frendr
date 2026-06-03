import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getVideoThumbnail } from "@/lib/videoEmbed"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json() as {
    streamId?:        string
    externalUrl?:     string
    title:            string
    description?:     string
    tags?:            string[]
    isPublic?:        boolean
    allowDownloads?:  boolean
    isAiGenerated?:   boolean
    thumbnailUrl?:    string
    collaborators?:   { userId: string; role?: string | null }[]
  }

  const { streamId, externalUrl, title, description, tags, isPublic, allowDownloads, isAiGenerated, thumbnailUrl, collaborators } = body

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 })
  if (!streamId && !externalUrl) {
    return NextResponse.json({ error: "streamId or externalUrl is required" }, { status: 400 })
  }

  const resolvedThumbnail = thumbnailUrl
    ?? (streamId     ? `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?width=1280` : null)
    ?? (externalUrl  ? getVideoThumbnail(externalUrl) : null)

  try {
    const video = await prisma.video.create({
      data: {
        streamId:      streamId       ?? null,
        externalUrl:   externalUrl    ?? null,
        title,
        description:   description    ?? null,
        tags:          tags           ?? [],
        thumbnailUrl:  resolvedThumbnail ?? null,
        isPublic:      isPublic       ?? true,
        allowDownloads: allowDownloads ?? false,
        isAiGenerated: isAiGenerated  ?? false,
        userId: user.id,
      },
    })

    if (allowDownloads && streamId) {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
      const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
      if (accountId && token) {
        fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}/downloads`,
          {
            method:  "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(() => {})
      }
    }

    if (collaborators?.length) {
      await prisma.videoCollaborator.createMany({
        data: collaborators.map(({ userId, role }) => ({ videoId: video.id, userId, role: role ?? null })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(video, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Duplicate entry" }, { status: 409 })
    }
    console.error("[POST /api/videos]", err)
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 })
  }
}
