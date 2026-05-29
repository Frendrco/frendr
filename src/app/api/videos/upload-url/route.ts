import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Returns a Cloudflare Stream direct-creator-upload URL.
// The client uploads the file directly to Cloudflare — no server bandwidth used.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN

  if (!accountId || !token) {
    return NextResponse.json({ error: "Cloudflare Stream is not configured" }, { status: 503 })
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
        maxDurationSeconds: 3600,
        requireSignedURLs: false,
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error("Cloudflare Stream error:", body)
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 502 })
  }

  const { result } = await res.json() as {
    result: { uid: string; uploadURL: string }
  }

  return NextResponse.json({ uid: result.uid, uploadURL: result.uploadURL })
}
