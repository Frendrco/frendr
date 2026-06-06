import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json() as {
    items: {
      externalUrl:   string
      title:         string
      description?:  string | null
      thumbnailUrl?: string | null
      videoType?:    "PORTFOLIO" | "RECESS"
      categories?:   string[]
      tags?:         string[]
      isPublic?:     boolean
      isAiGenerated?: boolean
      embedAutoplay?: boolean
      embedLoop?:    boolean
      collaborators?: { userId: string; role?: string | null }[]
    }[]
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 10) {
    return NextResponse.json({ error: "1 to 10 items required" }, { status: 400 })
  }

  for (const item of body.items) {
    if (!item.externalUrl?.trim() || !item.title?.trim()) {
      return NextResponse.json({ error: "Each item needs externalUrl and title" }, { status: 400 })
    }
  }

  try {
    const created = await prisma.$transaction(
      body.items.map((item) =>
        prisma.video.create({
          data: {
            externalUrl:  item.externalUrl.trim(),
            title:        item.title.trim(),
            description:  item.description?.trim() || null,
            thumbnailUrl: item.thumbnailUrl ?? null,
            isPublic:     item.isPublic      ?? true,
            isAiGenerated: item.isAiGenerated ?? false,
            embedAutoplay: item.embedAutoplay ?? false,
            embedLoop:     item.embedLoop     ?? false,
            videoType:    item.videoType ?? "PORTFOLIO",
            categories:   item.categories ?? [],
            tags:         item.tags ?? [],
            userId:       user.id,
          },
          select: { id: true },
        })
      )
    )

    // Create collaborator records for Dropbox imports that include credits
    for (let i = 0; i < body.items.length; i++) {
      const colls = body.items[i].collaborators ?? []
      if (colls.length > 0) {
        await prisma.videoCollaborator.createMany({
          data: colls.map((c) => ({
            videoId: created[i].id,
            userId:  c.userId,
            role:    c.role ?? null,
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json(
      { created: created.length, ids: created.map((v) => v.id) },
      { status: 201 }
    )
  } catch (err) {
    console.error("[POST /api/videos/bulk-import]", err)
    return NextResponse.json({ error: "Failed to save videos" }, { status: 500 })
  }
}
