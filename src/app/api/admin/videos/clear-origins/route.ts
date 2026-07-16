import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// One-time backfill: clear allowedOrigins on every Cloudflare Stream video so
// the player embeds on any domain (older uploads were locked to frendr.co).
// Safe to run more than once. GET so an admin can trigger it from the browser.
export async function GET() {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return NextResponse.json({ error: "Cloudflare env missing" }, { status: 503 })

  const videos = await prisma.video.findMany({
    where: { streamId: { not: null } },
    select: { streamId: true },
  })
  const streamIds = videos.map((v) => v.streamId!).filter(Boolean)

  let updated = 0
  const failed: { streamId: string; status: number }[] = []

  const CHUNK = 20
  for (let i = 0; i < streamIds.length; i += CHUNK) {
    const chunk = streamIds.slice(i, i + CHUNK)
    await Promise.all(chunk.map(async (streamId) => {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ allowedOrigins: [] }),
        }
      ).catch(() => null)
      if (res?.ok) updated++
      else failed.push({ streamId, status: res?.status ?? 0 })
    }))
  }

  return NextResponse.json({ total: streamIds.length, updated, failed })
}
