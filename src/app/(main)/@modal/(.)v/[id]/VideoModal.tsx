"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { X, ExternalLink } from "lucide-react"
import Hls from "hls.js"
import { getVideoEmbedUrl, detectProvider } from "@/lib/videoEmbed"

type VideoData = {
  id: string
  slug: string | null
  title: string
  streamId: string | null
  externalUrl: string | null
  thumbnailUrl: string | null
  tags: string[]
  viewCount: number
  _count: { likes: number }
  user: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

function HlsPlayer({ streamId, thumbnailUrl }: { streamId: string; thumbnailUrl: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
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

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      poster={thumbnailUrl ?? undefined}
      className="absolute inset-0 h-full w-full object-contain bg-black"
    />
  )
}

function Player({ video }: { video: VideoData }) {
  if (!video.streamId && !video.externalUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-core-black">
        <p className="font-sans text-sm text-white/40">No video source.</p>
      </div>
    )
  }

  if (video.externalUrl && detectProvider(video.externalUrl) === "dropbox") {
    return (
      <video
        src={video.externalUrl}
        controls
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-contain bg-black"
      />
    )
  }

  if (video.externalUrl) {
    return (
      <iframe
        src={getVideoEmbedUrl(video.externalUrl)}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  return <HlsPlayer streamId={video.streamId!} thumbnailUrl={video.thumbnailUrl} />
}

export function VideoModal({ video }: { video: VideoData }) {
  const router = useRouter()
  const fullPageHref = `/v/${video.slug ?? video.id}`

  const close = useCallback(() => router.back(), [router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [close])

  const initials = video.user.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm md:p-8"
      onClick={close}
    >
      {/* Wrapper — positions the floating X above the card */}
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>

        {/* Floating close button — above the card, top-right */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={15} />
        </button>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-core-black shadow-2xl">

          {/* Player */}
          <div className="relative aspect-video w-full bg-black">
            <Player video={video} />
          </div>

          {/* Single-row info strip */}
          <div className="flex items-center gap-3 px-4 py-3">

            {/* Creator */}
            <Link
              href={`/${video.user.username}`}
              className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-70"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-spring-green">
                {video.user.avatarUrl ? (
                  <Image
                    src={video.user.avatarUrl}
                    alt={video.user.displayName}
                    width={24}
                    height={24}
                    sizes="24px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-sans font-bold text-[9px] text-core-black">{initials}</span>
                )}
              </div>
              <span className="font-sans text-xs text-white/50">{video.user.displayName}</span>
            </Link>

            <span className="text-white/20">·</span>

            {/* Title */}
            <p className="flex-1 truncate font-sans text-sm font-medium text-white">
              {video.title}
            </p>

            {/* Enter pill */}
            <a
              href={fullPageHref}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 font-sans text-xs text-white/50 transition-colors hover:border-white/40 hover:text-white"
            >
              <ExternalLink size={10} />
              Enter
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
