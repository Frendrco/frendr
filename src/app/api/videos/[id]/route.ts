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
    title?:          string
    description?:    string | null
    tags?:           string[]
    thumbnailUrl?:   string | null
    isPublic?:       boolean
    allowDownloads?: boolean
    videoType?:      "PORTFOLIO" | "RECESS"
    collaborators?:  { userId: string; role?: string | null }[]
  }
  const { title, description, tags, thumbnailUrl, isPublic, allowDownloads, videoType, collaborators } = body

  const updated = await prisma.video.update({
    where: { id },
    data: {
      ...(title          !== undefined && { title }),
      ...(description    !== undefined && { description }),
      ...(tags           !== undefined && { tags }),
      ...(thumbnailUrl   !== undefined && { thumbnailUrl }),
      ...(isPublic       !== undefined && { isPublic }),
      ...(allowDownloads !== undefined && { allowDownloads }),
      ...(videoType      !== undefined && { videoType }),
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
    await prisma.$transaction([
      prisma.videoCollaborator.deleteMany({ where: { videoId: id } }),
      ...(collaborators.length > 0
        ? [prisma.videoCollaborator.createMany({
            data: collaborators.map((c) => ({ videoId: id, userId: c.userId, role: c.role ?? null })),
            skipDuplicates: true,
          })]
        : []),
    ])
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
