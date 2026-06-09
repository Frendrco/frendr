import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return NextResponse.json({ error: "Missing Cloudflare env vars" }, { status: 503 })

  const videos = await prisma.video.findMany({
    where: { streamId: { not: null } },
    select: { id: true, slug: true, streamId: true, isProcessed: true },
  })

  const results = []

  for (const video of videos) {
    if (!video.streamId) continue

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const cfData = await cfRes.json() as { result?: { requireSignedURLs?: boolean; status?: { state?: string }; duration?: number } }

    const needsUnlock   = cfData.result?.requireSignedURLs === true
    const isReady       = cfData.result?.status?.state === "ready"
    const cfDuration    = cfData.result?.duration

    const updates: { requireSignedURLs?: boolean } = {}
    if (needsUnlock) updates.requireSignedURLs = false

    if (needsUnlock) {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ requireSignedURLs: false }),
        }
      )
    }

    if (isReady && (!video.isProcessed || cfDuration)) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          isProcessed: true,
          ...(cfDuration ? { duration: Math.round(cfDuration) } : {}),
        },
      })
    }

    results.push({
      slug: video.slug,
      streamId: video.streamId,
      wasLocked: needsUnlock,
      wasUnprocessed: !video.isProcessed,
      cfState: cfData.result?.status?.state,
    })
  }

  const fixed = results.filter((r) => r.wasLocked || r.wasUnprocessed)
  return NextResponse.json({ total: videos.length, fixed: fixed.length, details: fixed })
}
