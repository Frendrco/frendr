import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug param required" }, { status: 400 })

  const video = await prisma.video.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true, slug: true, title: true, streamId: true, isProcessed: true, duration: true, createdAt: true },
  })

  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN

  let cfData = null
  if (video.streamId && accountId && token) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.streamId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    cfData = await res.json()
  }

  return NextResponse.json({ video, cloudflare: cfData })
}
