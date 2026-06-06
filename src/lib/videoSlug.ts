import { randomBytes } from "node:crypto"
import { prisma } from "./prisma"

function makeSlug(): string {
  return randomBytes(8).toString("base64url").slice(0, 10)
}

export async function uniqueVideoSlug(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const slug = makeSlug()
    const existing = await prisma.video.findUnique({ where: { slug }, select: { id: true } })
    if (!existing) return slug
  }
  // Fallback: append extra entropy
  return makeSlug() + makeSlug().slice(0, 4)
}
