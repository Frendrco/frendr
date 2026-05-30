"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getVideoEmbedUrl, detectProvider } from "@/lib/videoEmbed"

interface Props {
  streamId:    string | null
  externalUrl: string | null
  title:       string
  streamReady: boolean
}

export function VideoPlayer({ streamId, externalUrl, title, streamReady }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (streamReady || !streamId || externalUrl) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [streamReady, streamId, externalUrl, router])

  // External video (YouTube, Vimeo, Framerate)
  if (externalUrl) {
    const provider  = detectProvider(externalUrl)
    const embedUrl  = getVideoEmbedUrl(externalUrl)
    const isFramerate = provider === "framerate"

    return (
      <div className="flex flex-col">
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

  // Native Cloudflare upload — processing
  if (!streamId || !streamReady) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        <p className="font-sans text-sm text-white/40">Processing video… this usually takes a minute</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://iframe.videodelivery.net/${streamId}?autoplay=false&controls=true&muted=false`}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
