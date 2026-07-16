import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { FREE_UPLOAD_SECONDS } from "@/lib/stripe"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response(null, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, isPro: true, isAdmin: true },
  })
  if (!user) return new Response(null, { status: 404 })

  if (!user.isPro && !user.isAdmin) {
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

  let body: { fileSize?: unknown; name?: unknown; filename?: unknown; filetype?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const { fileSize, name, filename, filetype } = body
  if (typeof fileSize !== "number" || !Number.isInteger(fileSize) || fileSize <= 0) {
    console.error("[upload-url] invalid fileSize:", fileSize)
    return new Response(null, { status: 400 })
  }

  // Encode metadata server-side so antivirus on the client can't strip TUS headers
  const enc = (v: string) => Buffer.from(v).toString("base64")
  // No allowedOrigins → Cloudflare allows the player to be embedded on any
  // domain, matching the "Allow embedding on other sites" feature.
  const uploadMetadata = [
    `name ${enc(String(name || filename || "upload"))}`,
    `filename ${enc(String(filename || "upload"))}`,
    `filetype ${enc(String(filetype || "video/mp4"))}`,
    `maxDurationSeconds ${enc("600")}`,
  ].join(",")

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        Authorization:     `Bearer ${token}`,
        "Tus-Resumable":   "1.0.0",
        "Upload-Length":   String(fileSize),
        "Upload-Metadata": uploadMetadata,
      },
    }
  )

  if (!res.ok) {
    const errBody = await res.text()
    console.error("[upload-url] Cloudflare error:", res.status, errBody)
    return new Response(null, { status: 502 })
  }

  const uploadUrl = res.headers.get("Location") ?? ""
  const uid       = res.headers.get("stream-media-id") ?? ""
  console.log("[upload-url] TUS upload created — uid:", uid)

  return new Response(JSON.stringify({ uploadUrl, uid }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  })
}
