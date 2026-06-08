import { detectProvider, getVideoThumbnail } from "@/lib/videoEmbed"

export interface VideoMetadata {
  title:        string | null
  thumbnailUrl: string | null
  description:  string | null
}

const ALLOWED_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
  "vimeo.com", "www.vimeo.com", "player.vimeo.com",
  "framerate.tv", "www.framerate.tv",
  "dropbox.com", "www.dropbox.com", "dl.dropboxusercontent.com",
])

// RFC-1918, loopback, link-local (AWS metadata), and IPv6 private ranges
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|0\.|::1$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i

function isAllowedUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== "https:" && protocol !== "http:") return false
    if (PRIVATE_IP_RE.test(hostname)) return false
    return ALLOWED_HOSTS.has(hostname)
  } catch {
    return false
  }
}

function extractOgTag(html: string, prop: string): string | null {
  return (
    html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"))?.[1] ??
    null
  )
}

function resolveUrl(value: string | null, base: string): string | null {
  if (!value) return null
  try {
    return new URL(value, base).href
  } catch {
    return value
  }
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
      thumbnailUrl: resolveUrl(extractOgTag(html, "image"), url),
      description:  extractOgTag(html, "description"),
    }
  } catch {
    return { title: null, thumbnailUrl: null, description: null }
  }
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  if (!isAllowedUrl(url)) return { title: null, thumbnailUrl: null, description: null }

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
