import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const video = await prisma.video.findUnique({ where: { id }, select: { userId: true, streamId: true } })
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (video.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json() as {
    title?:             string
    description?:       string | null
    tags?:              string[]
    thumbnailUrl?:      string | null
    isPublic?:          boolean
    allowDownloads?:    boolean
    videoType?:         "PORTFOLIO" | "RECESS"
    collaborators?:     { userId: string; role?: string | null }[]
    embedAutoplay?:     boolean
    embedLoop?:         boolean
    embedShowControls?: boolean
    allowEmbedding?:    boolean
  }
  const { title, description, tags, thumbnailUrl, isPublic, allowDownloads, videoType, collaborators,
          embedAutoplay, embedLoop, embedShowControls, allowEmbedding } = body

  const updated = await prisma.video.update({
    where: { id },
    data: {
      ...(title             !== undefined && { title }),
      ...(description       !== undefined && { description }),
      ...(tags              !== undefined && { tags }),
      ...(thumbnailUrl      !== undefined && { thumbnailUrl }),
      ...(isPublic          !== undefined && { isPublic }),
      ...(allowDownloads    !== undefined && { allowDownloads }),
      ...(videoType         !== undefined && { videoType }),
      ...(embedAutoplay     !== undefined && { embedAutoplay }),
      ...(embedLoop         !== undefined && { embedLoop }),
      ...(embedShowControls !== undefined && { embedShowControls }),
      ...(allowEmbedding    !== undefined && { allowEmbedding }),
    },
  })

  if (allowDownloads !== undefined && video.streamId) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
    if (accountId && token) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}/downloads`
      fetch(url, {
        method:  allowDownloads ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  }

  if (collaborators !== undefined) {
    const existing = await prisma.videoCollaborator.findMany({ where: { videoId: id } })
    const existingMap = new Map(existing.map((c) => [c.userId, c]))
    const incomingIds = new Set(collaborators.map((c) => c.userId))

    const toRemove = existing.filter((c) => !incomingIds.has(c.userId))
    const toAdd    = collaborators.filter((c) => !existingMap.has(c.userId))
    const toUpdate = collaborators.filter((c) =>  existingMap.has(c.userId))

    await prisma.$transaction([
      ...(toRemove.length > 0
        ? [prisma.videoCollaborator.deleteMany({ where: { id: { in: toRemove.map((c) => c.id) } } })]
        : []),
      ...(toAdd.length > 0
        ? [prisma.videoCollaborator.createMany({
            data: toAdd.map((c) => ({ videoId: id, userId: c.userId, role: c.role ?? null, status: "PENDING" })),
            skipDuplicates: true,
          })]
        : []),
      ...toUpdate.map((c) =>
        prisma.videoCollaborator.updateMany({
          where: { videoId: id, userId: c.userId },
          data: { role: c.role ?? null },
        })
      ),
    ])

    if (toAdd.length > 0) {
      const [videoData, owner] = await Promise.all([
        prisma.video.findUnique({ where: { id }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } }),
      ])
      const newCollabs = await prisma.videoCollaborator.findMany({
        where: { videoId: id, userId: { in: toAdd.map((c) => c.userId) } },
        select: { id: true, userId: true, role: true },
      })
      await prisma.notification.createMany({
        data: newCollabs.map((c) => ({
          userId: c.userId,
          type: "credit_request",
          fromUserId: user.id,
          contentId: c.id,
          contentType: "credit_request",
          message: JSON.stringify({
            videoTitle: videoData?.title ?? "a video",
            role: c.role,
            videoId: id,
            ownerName: owner?.displayName ?? "Someone",
          }),
        })),
      })
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const video = await prisma.video.findUnique({ where: { id }, select: { userId: true, streamId: true } })
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (video.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.$transaction([
    prisma.user.updateMany({ where: { pinnedVideoId: id }, data: { pinnedVideoId: null } }),
    prisma.video.delete({ where: { id } }),
  ])

  if (video.streamId) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
    if (accountId && token) {
      fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {})
    }
  }

  return new NextResponse(null, { status: 204 })
}
