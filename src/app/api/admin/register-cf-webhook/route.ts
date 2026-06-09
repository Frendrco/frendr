import { NextResponse } from "next/server"

export async function GET() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN

  if (!accountId || !token) {
    return NextResponse.json({ error: "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN" }, { status: 503 })
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/webhook`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationUrl: "https://frendr.co/api/webhooks/cloudflare-stream" }),
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
