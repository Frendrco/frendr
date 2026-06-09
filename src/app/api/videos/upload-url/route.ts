import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { FREE_UPLOAD_SECONDS } from "@/lib/stripe"

const CORS = {
  "Access-Control-Allow-Origin":   "https://frendr.co",
  "Access-Control-Allow-Methods":  "POST, OPTIONS",
  "Access-Control-Allow-Headers":  "*",
  "Access-Control-Expose-Headers": "Location, stream-media-id",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response(null, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, isPro: true },
  })
  if (!user) return new Response(null, { status: 404 })

  if (!user.isPro) {
    const agg = await prisma.video.aggregate({
      where: { userId: user.id, duration: { not: null } },
      _sum: { duration: true },
    })
    const totalSeconds = agg._sum.duration ?? 0
    if (totalSeconds >= FREE_UPLOAD_SECONDS) {
      return new Response(null, { status: 402 })
    }
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return new Response(null, { status: 503 })

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        Authorization:     `Bearer ${token}`,
        "Tus-Resumable":   req.headers.get("Tus-Resumable")   ?? "1.0.0",
        "Upload-Length":   req.headers.get("Upload-Length")   ?? "0",
        "Upload-Metadata": req.headers.get("Upload-Metadata") ?? "",
      },
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error("[upload-url] Cloudflare error:", res.status, body)
    return new Response(null, { status: 502 })
  }

  const location = res.headers.get("Location") ?? ""
  const uid      = res.headers.get("stream-media-id") ?? ""
  console.log("[upload-url] TUS upload created — uid:", uid)

  return new Response(null, {
    status: 201,
    headers: { ...CORS, "Location": location, "stream-media-id": uid, "Tus-Resumable": "1.0.0" },
  })
}
