"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getVideoEmbedUrl, detectProvider } from "@/lib/videoEmbed"

type StreamStatus = "ready" | "processing" | "error" | "unknown"

interface Props {
  streamId:     string | null
  externalUrl:  string | null
  title:        string
  streamStatus?: StreamStatus
}

export function VideoPlayer({ streamId, externalUrl, title, streamStatus = "unknown" }: Props) {
  const router = useRouter()

  // Poll for readiness while the video is processing
  useEffect(() => {
    if (streamStatus !== "processing" || !streamId) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [streamStatus, streamId, router])

  // External video (YouTube, Vimeo, Framerate)
  if (externalUrl) {
    const provider    = detectProvider(externalUrl)
    const embedUrl    = getVideoEmbedUrl(externalUrl)
    const isFramerate = provider === "framerate"

    return (
      <div className="flex flex-col">
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        {isFramerate && (
          <div className="flex justify-end bg-core-black px-4 py-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-white/40 hover:text-white transition-colors"
            >
              View on Framerate →
            </a>
          </div>
        )}
      </div>
    )
  }

  // No streamId at all — shouldn't normally happen
  if (!streamId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <p className="font-sans text-sm text-white/40">No video source found.</p>
      </div>
    )
  }

  // Cloudflare says video is still processing → show spinner and poll
  if (streamStatus === "processing") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        <p className="font-sans text-sm text-white/40">Processing video… this usually takes a minute</p>
      </div>
    )
  }

  // Cloudflare returned an error state
  if (streamStatus === "error") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <p className="font-sans text-sm text-white/40">There was a problem processing this video.</p>
      </div>
    )
  }

  // ready or unknown — always try the player
  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://iframe.videodelivery.net/${streamId}?autoplay=false&controls=true&muted=false`}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
