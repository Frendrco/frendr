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
  thumbnailUrl?: string | null
  streamStatus?: StreamStatus
  autoPlay?:     boolean
  loop?:         boolean
}

export function VideoPlayer({ streamId, externalUrl, title, thumbnailUrl, streamStatus = "unknown", autoPlay = false, loop = false }: Props) {
  const router   = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamId) return
    const hlsUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`
    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: false })
      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        hls.currentLevel = data.levels.length - 1
      })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl
    }
  }, [streamId])

  // Poll every 5s while Cloudflare is processing
  useEffect(() => {
    if (streamStatus !== "processing" || !streamId) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [streamStatus, streamId])

  // ── No source ─────────────────────────────────────────────────
  if (!streamId && !externalUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <p className="font-sans text-sm text-white/40">No video source found.</p>
      </div>
    )
  }

  // ── Still processing ───────────────────────────────────────────
  if (!externalUrl && streamStatus === "processing") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-5 bg-core-black px-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
          <p className="font-sans text-sm font-medium text-white/70">Processing your video…</p>
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-white/50"
              style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
            />
          </div>
          <p className="font-sans text-xs text-white/30">This takes 1–2 minutes and happens in the background — go make some frends while you wait.</p>
        </div>
      </div>
    )
  }

  // ── Cloudflare Stream error ────────────────────────────────────
  if (!externalUrl && streamStatus === "error") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <p className="font-sans text-sm text-white/40">There was a problem processing this video.</p>
      </div>
    )
  }

  // ── Dropbox — direct MP4 ───────────────────────────────────────
  if (externalUrl && detectProvider(externalUrl) === "dropbox") {
    return (
      <div className="relative aspect-video w-full bg-black">
        <video src={externalUrl} controls className="absolute inset-0 h-full w-full" />
      </div>
    )
  }

  // ── External embed (YouTube, Vimeo, Framerate, …) ─────────────
  if (externalUrl) {
    const provider         = detectProvider(externalUrl)
    const embedUrl         = getVideoEmbedUrl(externalUrl)
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

  // ── Cloudflare Stream — HLS player ────────────────────────────
  return (
    <div className="relative aspect-video w-full">
      <video
        ref={videoRef}
        controls
        autoPlay={autoPlay}
        loop={loop}
        muted={autoPlay}
        poster={thumbnailUrl ?? undefined}
        className="absolute inset-0 h-full w-full bg-black"
      />
    </div>
  )
}
