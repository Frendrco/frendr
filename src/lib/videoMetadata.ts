import { detectProvider, getVideoThumbnail } from "@/lib/videoEmbed"

export interface VideoMetadata {
  title:        string | null
  thumbnailUrl: string | null
  description:  string | null
}

function extractOgTag(html: string, prop: string): string | null {
  return (
    html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"))?.[1] ??
    null
  )
}

async function scrapeOpenGraph(url: string): Promise<VideoMetadata> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Frendr/1.0)" },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { title: null, thumbnailUrl: null, description: null }
    const html = await res.text()
    return {
      title:        extractOgTag(html, "title"),
      thumbnailUrl: extractOgTag(html, "image"),
      description:  extractOgTag(html, "description"),
    }
  } catch {
    return { title: null, thumbnailUrl: null, description: null }
  }
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  const provider = detectProvider(url)

  if (provider === "youtube") {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json() as { title?: string; thumbnail_url?: string }
        return {
          title:        data.title        ?? null,
          thumbnailUrl: data.thumbnail_url ?? getVideoThumbnail(url),
          description:  null,
        }
      }
    } catch {}
    // oEmbed failed — use YouTube CDN thumbnail
    return { title: null, thumbnailUrl: getVideoThumbnail(url), description: null }
  }

  if (provider === "vimeo") {
    try {
      const res = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json() as { title?: string; thumbnail_url?: string; description?: string }
        return {
          title:        data.title         ?? null,
          thumbnailUrl: data.thumbnail_url ?? null,
          description:  data.description   ?? null,
        }
      }
    } catch {}
  }

  // Framerate and all other providers: scrape OpenGraph tags
  return scrapeOpenGraph(url)
}
