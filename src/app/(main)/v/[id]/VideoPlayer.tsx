"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Hls from "hls.js"
import { getVideoEmbedUrl, getProviderLabel, detectProvider } from "@/lib/videoEmbed"

type StreamStatus = "ready" | "processing" | "error" | "unknown"

interface Props {
  streamId:      string | null
  externalUrl:   string | null
  title:         string
  streamStatus?: StreamStatus
  autoPlay?:     boolean
  loop?:         boolean
}

export function VideoPlayer({ streamId, externalUrl, title, streamStatus = "unknown", autoPlay = false, loop = false }: Props) {
  const router   = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamId) return

    const hlsUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: false })
      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        // Cloudflare orders levels lowest→highest; lock to the last (highest quality)
        hls.currentLevel = data.levels.length - 1
      })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — native HLS
      video.src = hlsUrl
    }
  }, [streamId])

  // Poll for readiness while the video is processing
  useEffect(() => {
    if (streamStatus !== "processing" || !streamId) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [streamStatus, streamId])

  // External video (YouTube, Vimeo, Framerate, Dropbox)
  if (externalUrl) {
    const provider = detectProvider(externalUrl)

    // Dropbox: direct MP4, native video element (no iframe)
    if (provider === "dropbox") {
      return (
        <div className="relative aspect-video w-full bg-black">
          <video
            src={externalUrl}
            controls
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )
    }

    const embedUrl = getVideoEmbedUrl(externalUrl)

    const showExternalLink = provider === "framerate" || provider === "vimeo"

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
        {showExternalLink && (
          <div className="flex justify-end bg-core-black px-4 py-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-white/40 hover:text-white transition-colors"
            >
              View on {getProviderLabel(provider)} →
            </a>
          </div>
        )}
      </div>
    )
  }

  // No streamId — shouldn't normally happen
  if (!streamId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <p className="font-sans text-sm text-white/40">No video source found.</p>
      </div>
    )
  }

  // Still processing
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

  // Ready or unknown — render the HLS player
  return (
    <div className="relative aspect-video w-full">
      <video
        ref={videoRef}
        controls
        autoPlay={autoPlay}
        loop={loop}
        muted={autoPlay}
        className="absolute inset-0 h-full w-full bg-black"
      />
    </div>
  )
}
