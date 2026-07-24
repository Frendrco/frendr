export type Provider = "youtube" | "vimeo" | "framerate" | "dropbox" | "other"

export function detectProvider(url: string): Provider {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") return "youtube"
    if (u.hostname.includes("vimeo.com")) return "vimeo"
    if (u.hostname.includes("framerate.tv")) return "framerate"
    if (u.hostname.includes("dropbox.com") || u.hostname.includes("dropboxusercontent.com")) return "dropbox"
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
    case "dropbox":   return "Dropbox"
    default:          return "External"
  }
}

export function getDropboxRawUrl(url: string): { rawUrl: string | null; error: string | null } {
  if (!url.toLowerCase().includes(".mp4")) {
    return { rawUrl: null, error: "Dropbox imports support MP4 files only." }
  }
  try {
    const u = new URL(url)
    u.searchParams.set("raw", "1")
    u.searchParams.delete("dl")
    return { rawUrl: u.toString(), error: null }
  } catch {
    return { rawUrl: null, error: "Invalid Dropbox URL" }
  }
}

export function getVideoEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/embed/${v}?vq=hd1080`
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1).split("?")[0]
      if (v) return `https://www.youtube.com/embed/${v}?vq=hd1080`
    }
    if (u.hostname.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean)
      const v = parts[0]
      const h = parts[1]
      if (v) return `https://player.vimeo.com/video/${v}${h ? `?h=${h}&quality=1080p` : "?quality=1080p"}`
    }
    if (u.hostname.includes("framerate.tv")) {
      const parts = u.pathname.split("/").filter(Boolean)
      // Only /watch/<id> and /embed/<id> are real videos — profile/other pages aren't embeddable
      if ((parts[0] === "watch" || parts[0] === "embed") && parts[1]) {
        return `https://framerate.tv/embed/${parts[1]}`
      }
    }
    return url
  } catch {
    return url
  }
}

// Whether a URL points to an actual embeddable video (not a profile/channel/home page).
// Use this to validate on submit so we never store a link that renders a blank player.
export function isEmbeddableVideoUrl(url: string): boolean {
  const provider = detectProvider(url)
  try {
    const u = new URL(url)
    switch (provider) {
      case "youtube":
        return u.hostname === "youtu.be"
          ? u.pathname.slice(1).split("?")[0].length > 0
          : !!u.searchParams.get("v")
      case "vimeo":
        return u.pathname.split("/").filter(Boolean).length > 0
      case "framerate": {
        const parts = u.pathname.split("/").filter(Boolean)
        return (parts[0] === "watch" || parts[0] === "embed") && !!parts[1]
      }
      case "dropbox":
        return url.toLowerCase().includes(".mp4")
      default:
        return false
    }
  } catch {
    return false
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
