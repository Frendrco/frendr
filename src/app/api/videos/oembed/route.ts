import { NextResponse } from "next/server"
import { detectProvider } from "@/lib/videoEmbed"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) return NextResponse.json({ title: null, thumbnailUrl: null })

  const provider = detectProvider(url)

  try {
    if (provider === "youtube") {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) return NextResponse.json({ title: null, thumbnailUrl: null })
      const data = await res.json() as { title?: string; thumbnail_url?: string }
      return NextResponse.json({
        title:        data.title        ?? null,
        thumbnailUrl: data.thumbnail_url ?? null,
      })
    }

    if (provider === "vimeo") {
      const res = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) return NextResponse.json({ title: null, thumbnailUrl: null })
      const data = await res.json() as { title?: string; thumbnail_url?: string }
      return NextResponse.json({
        title:        data.title        ?? null,
        thumbnailUrl: data.thumbnail_url ?? null,
      })
    }
  } catch {
    // oEmbed fetch failed — return nulls, client falls back to manual entry
  }

  return NextResponse.json({ title: null, thumbnailUrl: null })
}
