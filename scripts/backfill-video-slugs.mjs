// DATABASE_URL=... node scripts/backfill-video-slugs.mjs
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { randomBytes } from "crypto"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function makeSlug() {
  return randomBytes(8).toString("base64url").slice(0, 10)
}

async function uniqueSlug(usedSlugs) {
  for (let i = 0; i < 20; i++) {
    const slug = makeSlug()
    if (!usedSlugs.has(slug)) {
      const existing = await prisma.video.findUnique({ where: { slug }, select: { id: true } })
      if (!existing) {
        usedSlugs.add(slug)
        return slug
      }
    }
  }
  throw new Error("Could not generate unique slug after 20 attempts")
}

async function main() {
  const videos = await prisma.video.findMany({
    where: { slug: null },
    select: { id: true },
  })

  console.log(`Backfilling ${videos.length} videos…`)

  const usedSlugs = new Set()
  let count = 0

  for (const video of videos) {
    const slug = await uniqueSlug(usedSlugs)
    await prisma.video.update({ where: { id: video.id }, data: { slug } })
    count++
    if (count % 10 === 0) process.stdout.write(`  ${count}/${videos.length}\r`)
  }

  console.log(`\nDone — ${count} slugs generated.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
