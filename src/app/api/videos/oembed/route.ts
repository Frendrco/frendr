import { NextResponse } from "next/server"
import { fetchVideoMetadata } from "@/lib/videoMetadata"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) return NextResponse.json({ title: null, thumbnailUrl: null, description: null })

  const meta = await fetchVideoMetadata(url)
  return NextResponse.json(meta)
}
