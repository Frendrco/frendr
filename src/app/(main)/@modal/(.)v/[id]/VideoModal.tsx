"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { X, ExternalLink, Heart, Play, Pause } from "lucide-react"
import Hls from "hls.js"
import { cn } from "@/lib/utils"
import { getVideoEmbedUrl, detectProvider } from "@/lib/videoEmbed"
import { AddToChannelButton } from "@/components/common/AddToChannelButton"

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

function TapOverlay({ videoRef, onTap }: { videoRef: React.RefObject<HTMLVideoElement | null>; onTap?: () => void }) {
  const [playing, setPlaying] = useState(true)
  const [showIcon, setShowIcon] = useState(false)
  const iconTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTap() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
    setShowIcon(true)
    if (iconTimer.current) clearTimeout(iconTimer.current)
    iconTimer.current = setTimeout(() => setShowIcon(false), 800)
    onTap?.()
  }

  return (
    <div
      className="absolute inset-0 hidden [@media(hover:none)]:flex items-center justify-center cursor-pointer"
      onClick={handleTap}
    >
      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full bg-black/50 transition-opacity duration-300",
        showIcon ? "opacity-100" : "opacity-0"
      )}>
        {playing
          ? <Pause size={22} fill="white" className="text-white" />
          : <Play  size={22} fill="white" className="ml-1 text-white" />}
      </div>
    </div>
  )
}

function HlsPlayer({ streamId, thumbnailUrl, onVideoSize, onTap }: {
  streamId: string
  thumbnailUrl: string | null
  onVideoSize?: (w: number, h: number) => void
  onTap?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onVideoSizeRef = useRef(onVideoSize)
  onVideoSizeRef.current = onVideoSize

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const hlsUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`
    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: false })
      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        hls.currentLevel = data.levels.length - 1
        const level = data.levels[data.levels.length - 1]
        if (level?.width && level?.height) onVideoSizeRef.current?.(level.width, level.height)
      })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl
    }
  }, [streamId])

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        poster={thumbnailUrl ?? undefined}
        className="h-full w-full object-contain bg-black"
      />
      {/* Tap overlay only active on touch devices — covers native controls so they never appear on mobile */}
      <TapOverlay videoRef={videoRef} onTap={onTap} />
    </div>
  )
}

function DirectVideoPlayer({ src, onTap }: { src: string; onTap?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        controls
        className="h-full w-full object-contain bg-black"
      />
      <TapOverlay videoRef={videoRef} onTap={onTap} />
    </div>
  )
}

function Player({ video, onVideoSize, onTap }: { video: VideoData; onVideoSize?: (w: number, h: number) => void; onTap?: () => void }) {
  if (!video.streamId && !video.externalUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-core-black">
        <p className="font-sans text-sm text-white/40">No video source.</p>
      </div>
    )
  }

  if (video.externalUrl && detectProvider(video.externalUrl) === "dropbox") {
    return <DirectVideoPlayer src={video.externalUrl} onTap={onTap} />
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

  return <HlsPlayer streamId={video.streamId!} thumbnailUrl={video.thumbnailUrl} onVideoSize={onVideoSize} onTap={onTap} />
}

export function VideoModal({
  video,
  initialUpvoted,
  initialVideoSize = null,
}: {
  video: VideoData
  initialUpvoted: boolean
  initialVideoSize?: { w: number; h: number } | null
}) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const fullPageHref = `/v/${video.slug ?? video.id}`

  const [liked, setLiked] = useState(initialUpvoted)
  const [likeCount, setLikeCount] = useState(video._count.likes)
  const [likeLoading, setLikeLoading] = useState(false)
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(initialVideoSize)
  const isPortrait = videoSize ? videoSize.h > videoSize.w : false

  // Info overlay auto-hides on mobile after 3s; re-shows briefly on each tap
  const [overlayVisible, setOverlayVisible] = useState(true)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showOverlayBriefly() {
    setOverlayVisible(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => setOverlayVisible(false), 3000)
  }

  useEffect(() => {
    showOverlayBriefly()
    return () => { if (overlayTimer.current) clearTimeout(overlayTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (likeLoading) return
    setLikeLoading(true)
    setLiked(v => !v)
    setLikeCount(c => liked ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/videos/${video.id}/like`, { method: "POST" })
      if (res.ok) {
        const data = await res.json() as { liked: boolean; count: number }
        setLiked(data.liked)
        setLikeCount(data.count)
      }
    } finally {
      setLikeLoading(false)
    }
  }

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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-2 sm:p-4 md:p-8 backdrop-blur-sm"
      onClick={close}
    >
      {/* Single close button — always in top-right of overlay */}
      <button
        onClick={(e) => { e.stopPropagation(); close() }}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={15} />
      </button>

      {/* Wrapper */}
      <div className="group/modal relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>

        {/* Card — mx-auto centers portrait cards; no-op for landscape */}
        <div
          className="relative mx-auto w-full overflow-hidden rounded-2xl bg-black shadow-2xl"
          style={
            isPortrait && videoSize
              ? { aspectRatio: `${videoSize.w}/${videoSize.h}`, maxHeight: "80vh", width: `calc(80vh * ${videoSize.w} / ${videoSize.h})`, maxWidth: "100%" }
              : { aspectRatio: "16/9" }
          }
        >

          <Player video={video} onVideoSize={(w, h) => setVideoSize({ w, h })} onTap={showOverlayBriefly} />

          {/* Info overlay — hover on desktop; auto-hides on mobile, re-shows on tap */}
          <div className={cn(
            "absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent px-5 pt-4 pb-10 transition-opacity duration-500",
            "opacity-0 group-hover/modal:opacity-100",
            overlayVisible && "[@media(hover:none)]:opacity-100"
          )}>
            {/* pr-12 on mobile keeps content clear of the absolute X button */}
            <div className="flex items-center gap-3 pr-12 sm:pr-0">

              {/* Creator */}
              <a
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
                <span className="font-sans text-xs text-white/70">{video.user.displayName}</span>
              </a>

              <span className="text-white/30">·</span>

              {/* Title */}
              <a
                href={fullPageHref}
                className="flex-1 truncate font-sans text-sm font-medium text-white hover:opacity-70 transition-opacity"
              >
                {video.title}
              </a>

              {/* Like button */}
              <button
                onClick={handleLike}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-xs backdrop-blur-sm transition-colors",
                  liked
                    ? "border-spring-green bg-spring-green/20 text-spring-green"
                    : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                )}
              >
                <Heart size={11} className={liked ? "fill-current" : ""} />
                <span>{likeCount}</span>
              </button>

              {/* Channel button — hide on mobile */}
              <div className="hidden sm:block">
                <AddToChannelButton
                  videoId={video.id}
                  triggerClassName="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 font-sans text-xs text-white/60 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white"
                />
              </div>

              {/* Enter pill — hide on mobile */}
              <a
                href={fullPageHref}
                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 font-sans text-xs text-white/60 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white"
              >
                <ExternalLink size={10} />
                Enter
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
