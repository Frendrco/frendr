import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { FREE_UPLOAD_SECONDS } from "@/lib/stripe"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://frendr.co",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, isPro: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: CORS_HEADERS })

  if (!user.isPro) {
    const agg = await prisma.video.aggregate({
      where: { userId: user.id, duration: { not: null } },
      _sum: { duration: true },
    })
    const totalSeconds = agg._sum.duration ?? 0
    if (totalSeconds >= FREE_UPLOAD_SECONDS) {
      return NextResponse.json({ error: "upload_limit_reached" }, { status: 402, headers: CORS_HEADERS })
    }
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN

  if (!accountId || !token) {
    return NextResponse.json({ error: "Cloudflare Stream is not configured" }, { status: 503, headers: CORS_HEADERS })
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 600,
        requireSignedURLs: false,
        expiry: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        allowedOrigins: ["frendr.co", "www.frendr.co"],
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error("[upload-url] Cloudflare error — status:", res.status, "body:", body)
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 502, headers: CORS_HEADERS })
  }

  console.log("[upload-url] Cloudflare response OK — status:", res.status)

  const { result } = await res.json() as {
    result: { uid: string; uploadURL: string }
  }

  return NextResponse.json({ uid: result.uid, uploadURL: result.uploadURL }, { headers: CORS_HEADERS })
}
