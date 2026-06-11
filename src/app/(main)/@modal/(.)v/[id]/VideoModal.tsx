"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { X, ExternalLink, Eye } from "lucide-react"
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
      {/* Container */}
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-core-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={15} />
        </button>

        {/* Player */}
        <div className="relative aspect-video w-full bg-black">
          <Player video={video} />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2.5 p-4 md:p-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 pr-2">
            <h2 className="font-sans font-semibold text-sm text-white leading-snug md:text-base">
              {video.title}
            </h2>
            <a
              href={fullPageHref}
              className="shrink-0 inline-flex items-center gap-1 font-sans text-xs text-white/40 transition-colors hover:text-white"
            >
              <ExternalLink size={11} />
              Enter
            </a>
          </div>

          {/* Creator + meta */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/${video.user.username}`}
              className="inline-flex w-fit items-center gap-2 transition-opacity hover:opacity-70"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-spring-green">
                {video.user.avatarUrl ? (
                  <Image
                    src={video.user.avatarUrl}
                    alt={video.user.displayName}
                    width={20}
                    height={20}
                    sizes="20px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-sans font-bold text-[9px] text-core-black">{initials}</span>
                )}
              </div>
              <span className="font-sans text-xs text-white/60">{video.user.displayName}</span>
            </Link>

            <span className="flex items-center gap-1 font-sans text-xs text-white/30">
              <Eye size={11} />
              {video.viewCount.toLocaleString()}
            </span>
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {video.tags.slice(0, 5).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 font-sans text-[11px] text-white/40 transition-colors hover:border-white/30 hover:text-white"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
