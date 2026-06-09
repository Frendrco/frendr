import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function verifySignature(body: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false

  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")))
  const timestamp = parts["time"]
  const sig = parts["sig1"]
  if (!timestamp || !sig) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const payload = encoder.encode(`${timestamp}.${body}`)
  const computed = await crypto.subtle.sign("HMAC", key, payload)
  const computedHex = Array.from(new Uint8Array(computed)).map(b => b.toString(16).padStart(2, "0")).join("")

  return computedHex === sig
}

interface StreamWebhookPayload {
  uid: string
  readyToStream: boolean
  duration?: number
  thumbnail?: string
  status: {
    state: "pendingupload" | "waiting" | "processing" | "ready" | "error"
    errorReasonCode?: string
    errorReasonText?: string
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET

  if (secret) {
    const sig = req.headers.get("Webhook-Signature")
    const valid = await verifySignature(body, sig, secret)
    if (!valid) {
      console.warn("[cf-stream-webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  let payload: StreamWebhookPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { uid, status, duration } = payload
  console.log(`[cf-stream-webhook] uid=${uid} state=${status.state}`)

  if (status.state === "ready") {
    await prisma.video.updateMany({
      where: { streamId: uid },
      data: {
        ...(duration != null ? { duration: Math.round(duration) } : {}),
      },
    })
    console.log(`[cf-stream-webhook] Marked ready — uid=${uid} duration=${duration}s`)
  }

  if (status.state === "error") {
    console.error(`[cf-stream-webhook] Processing error — uid=${uid} code=${status.errorReasonCode} text=${status.errorReasonText}`)
  }

  return NextResponse.json({ received: true })
}
