import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fetchExternalThumbnail } from "@/lib/videoMetadata"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  // fetchExternalThumbnail gates on ALLOWED_HOSTS and blocks private IP ranges.
  // Without it this handler is an SSRF: any signed-in user could make the
  // server fetch arbitrary internal URLs.
  return NextResponse.json({ thumbnailUrl: await fetchExternalThumbnail(url) })
}
