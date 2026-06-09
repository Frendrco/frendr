import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return NextResponse.json({ error: "Missing Cloudflare env vars" }, { status: 503 })

  const limit = parseInt(new URL(req.url).searchParams.get("limit") ?? "50", 10)

  const videos = await prisma.video.findMany({
    where: { streamId: { not: null } },
    select: { id: true, slug: true, streamId: true, isProcessed: true },
    take: limit,
  })

  const results = await Promise.all(videos.map(async (video) => {
    if (!video.streamId) return null

    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const cfData = await cfRes.json() as { result?: { requireSignedURLs?: boolean; status?: { state?: string }; duration?: number } }

      const needsUnlock = cfData.result?.requireSignedURLs === true
      const isReady     = cfData.result?.status?.state === "ready"
      const cfDuration  = cfData.result?.duration

      const [cfFix, dbFix] = await Promise.all([
        needsUnlock
          ? fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ requireSignedURLs: false }),
              }
            ).then((r) => r.ok)
          : Promise.resolve(false),
        isReady && (!video.isProcessed || cfDuration)
          ? prisma.video.update({
              where: { id: video.id },
              data: {
                isProcessed: true,
                ...(cfDuration ? { duration: Math.round(cfDuration) } : {}),
              },
            }).then(() => true)
          : Promise.resolve(false),
      ])

      return { slug: video.slug, cfState: cfData.result?.status?.state, unlockedCF: cfFix, markedProcessed: dbFix }
    } catch (e) {
      return { slug: video.slug, error: String(e) }
    }
  }))

  const filtered = results.filter(Boolean)
  const fixed    = filtered.filter((r) => r && ("unlockedCF" in r) && (r.unlockedCF || r.markedProcessed))

  return NextResponse.json({ total: videos.length, fixed: fixed.length, details: filtered })
}
