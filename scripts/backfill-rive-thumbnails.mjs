/**
 * Backfill OG thumbnails for existing Rive World posts.
 * Usage: node --env-file=.env.local scripts/backfill-rive-thumbnails.mjs
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pkg from "pg"
const { Pool } = pkg

const url = new URL(process.env.DATABASE_URL)
url.searchParams.set("sslmode", "verify-full")
const pool = new Pool({ connectionString: url.toString() })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function riveEmbedToThumbnail(riveUrl) {
  const match = riveUrl.match(/\/s\/([^/?#]+)/)
  if (!match) return null
  return `https://public.rive.app/share-links/thumbnails/${match[1]}.png`
}

const threads = await prisma.thread.findMany({
  where: { source: "rive_world", imageUrls: { isEmpty: true } },
  select: { id: true, title: true, riveUrls: true },
})

console.log(`Found ${threads.length} Rive posts without thumbnails.\n`)

for (const thread of threads) {
  const riveUrl = thread.riveUrls[0]
  if (!riveUrl) { console.log(`  skip  ${thread.title} (no riveUrl)`); continue }

  const thumbnail = riveEmbedToThumbnail(riveUrl)
  if (!thumbnail) { console.log(`  skip  ${thread.title} (couldn't extract ID)`); continue }

  await prisma.thread.update({ where: { id: thread.id }, data: { imageUrls: [thumbnail] } })
  console.log(`  ✓  ${thread.title}`)
}

await prisma.$disconnect()
await pool.end()
console.log("\nDone.")
