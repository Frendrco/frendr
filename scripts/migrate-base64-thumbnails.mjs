/**
 * Migrate base64 thumbnails to proper URLs.
 *
 * - Cloudflare Stream videos → videodelivery.net thumbnail URL (no upload)
 * - Imported videos (externalUrl) → re-fetch thumbnail from platform via oEmbed
 * - Anything else → upload base64 to R2 and store the resulting URL
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-base64-thumbnails.mjs
 *
 * Requires DATABASE_URL to be set in your shell environment (it's left blank
 * in .env.local). Run from a terminal where the var is already exported.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// ── DB ────────────────────────────────────────────────────
const dbUrl = new URL(process.env.DATABASE_URL)
dbUrl.searchParams.set("sslmode", "require")
const pool = new Pool({ connectionString: dbUrl.toString(), max: 3 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ── R2 ────────────────────────────────────────────────────
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

async function uploadToR2(base64, videoId) {
  const match = base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) throw new Error("Unrecognised data URI format")
  const [, ext, data] = match
  const key = `thumbnails/${videoId}.${ext}`
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(data, "base64"),
    ContentType: `image/${ext}`,
  }))
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

async function fetchPlatformThumbnail(externalUrl) {
  try {
    const u = new URL(externalUrl)
    const host = u.hostname.replace("www.", "")

    if (host === "youtube.com" || host === "youtu.be") {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(externalUrl)}&format=json`)
      if (res.ok) return (await res.json()).thumbnail_url ?? null
    }

    if (host === "vimeo.com") {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(externalUrl)}&width=1280`)
      if (res.ok) return (await res.json()).thumbnail_url ?? null
    }

    // Generic OpenGraph fallback
    const res = await fetch(externalUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Frendr/1.0)" } })
    if (res.ok) {
      const html = await res.text()
      const match = html.match(/<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])/i)
      return match?.[1] ?? match?.[2] ?? null
    }
  } catch {}
  return null
}

async function main() {
  const videos = await prisma.video.findMany({
    where: { thumbnailUrl: { startsWith: "data:" } },
    select: { id: true, thumbnailUrl: true, streamId: true, externalUrl: true, title: true },
  })

  if (videos.length === 0) {
    console.log("No base64 thumbnails found — nothing to do.")
    return
  }

  console.log(`Found ${videos.length} video(s) with base64 thumbnails:\n`)

  for (const video of videos) {
    console.log(`[${video.id}] "${video.title}"`)
    let newUrl = null

    try {
      if (video.streamId) {
        newUrl = `https://videodelivery.net/${video.streamId}/thumbnails/thumbnail.jpg`
        console.log(`  → Cloudflare Stream thumbnail: ${newUrl}`)
      } else if (video.externalUrl) {
        newUrl = await fetchPlatformThumbnail(video.externalUrl)
        if (newUrl) console.log(`  → Platform oEmbed thumbnail: ${newUrl}`)
      }

      if (!newUrl) {
        newUrl = await uploadToR2(video.thumbnailUrl, video.id)
        console.log(`  → Uploaded to R2: ${newUrl}`)
      }

      await prisma.video.update({ where: { id: video.id }, data: { thumbnailUrl: newUrl } })
      console.log(`  ✓ Updated\n`)
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`)
    }
  }

  console.log("Done.")
}

main().finally(() => prisma.$disconnect())
