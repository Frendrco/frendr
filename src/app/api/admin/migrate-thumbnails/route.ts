import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { fetchVideoMetadata } from "@/lib/videoMetadata"

export const maxDuration = 60

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

async function uploadToR2(base64: string, videoId: string): Promise<string> {
  const match = base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) throw new Error("Unrecognised data URI")
  const [, ext, data] = match
  const key = `thumbnails/${videoId}.${ext}`
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
    Body: Buffer.from(data, "base64"),
    ContentType: `image/${ext}`,
  }))
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { thumbnailUrl: { startsWith: "data:" } },
        { thumbnailUrl: { contains: "image.mux.com" } },
      ],
    },
    select: { id: true, thumbnailUrl: true, streamId: true, externalUrl: true, title: true },
  })

  const results: { id: string; title: string; newUrl: string | null; error?: string }[] = []

  for (const video of videos) {
    let newUrl: string | null = null
    try {
      if (video.streamId) {
        newUrl = `https://videodelivery.net/${video.streamId}/thumbnails/thumbnail.jpg`
      } else if (video.externalUrl) {
        const meta = await fetchVideoMetadata(video.externalUrl)
        newUrl = meta.thumbnailUrl
      }
      if (!newUrl && video.thumbnailUrl) {
        newUrl = await uploadToR2(video.thumbnailUrl, video.id)
      }
      if (newUrl) {
        await prisma.video.update({ where: { id: video.id }, data: { thumbnailUrl: newUrl } })
      }
      results.push({ id: video.id, title: video.title, newUrl })
    } catch (err) {
      results.push({ id: video.id, title: video.title, newUrl: null, error: String(err) })
    }
  }

  return NextResponse.json({ migrated: results.length, results })
}
