import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug param required" }, { status: 400 })

  const video = await prisma.video.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true, streamId: true, duration: true },
  })
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN

  let cfResult = null
  if (video.streamId && accountId && token) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requireSignedURLs: false }),
      }
    )
    cfResult = await res.json()
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: { isProcessed: true },
    select: { id: true, isProcessed: true },
  })

  return NextResponse.json({ db: updated, cloudflare: cfResult })
}
