export type Provider = "youtube" | "vimeo" | "framerate" | "other"

export function detectProvider(url: string): Provider {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") return "youtube"
    if (u.hostname.includes("vimeo.com")) return "vimeo"
    if (u.hostname.includes("framerate.tv")) return "framerate"
    return "other"
  } catch {
    return "other"
  }
}

export function getProviderLabel(provider: Provider): string {
  switch (provider) {
    case "youtube":   return "YouTube"
    case "vimeo":     return "Vimeo"
    case "framerate": return "Framerate"
    default:          return "External"
  }
}

export function getVideoEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1).split("?")[0]
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.split("/").filter(Boolean)[0]
      if (v) return `https://player.vimeo.com/video/${v}`
    }
    if (u.hostname.includes("framerate.tv")) {
      const parts = u.pathname.split("/").filter(Boolean)
      const id = parts[parts.length - 1]
      if (id) return `https://framerate.tv/embed/${id}`
    }
    return url
  } catch {
    return url
  }
}

export function getVideoThumbnail(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v) return `https://img.youtube.com/vi/${v}/hqdefault.jpg`
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1).split("?")[0]
      if (v) return `https://img.youtube.com/vi/${v}/hqdefault.jpg`
    }
    return null
  } catch {
    return null
  }
}
