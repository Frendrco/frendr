import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"
import { fetchVideoMetadata } from "@/lib/videoMetadata"

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const body = await req.json().catch(() => ({})) as { username?: string }

  const videos = await prisma.video.findMany({
    where: {
      externalUrl:  { not: null },
      thumbnailUrl: null,
      ...(body.username
        ? { user: { username: body.username } }
        : {}),
    },
    select: { id: true, externalUrl: true, title: true, description: true },
  })

  let updated = 0
  const failed: string[] = []

  for (const video of videos) {
    if (!video.externalUrl) continue
    try {
      const meta = await fetchVideoMetadata(video.externalUrl)
      await prisma.video.update({
        where: { id: video.id },
        data: {
          ...(meta.thumbnailUrl                        ? { thumbnailUrl: meta.thumbnailUrl } : {}),
          ...(!video.title       && meta.title        ? { title:        meta.title        } : {}),
          ...(!video.description && meta.description  ? { description:  meta.description  } : {}),
        },
      })
      updated++
    } catch {
      failed.push(video.id)
    }
  }

  return NextResponse.json({ processed: videos.length, updated, failed })
}
