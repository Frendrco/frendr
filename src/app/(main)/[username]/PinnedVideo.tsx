"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pin, Play } from "lucide-react"
import { UnpinButton } from "./UnpinButton"
import { UpvoteButton } from "@/components/common/UpvoteButton"
import { AddToPlaylistButton } from "@/components/common/AddToPlaylistButton"
import { AddToChannelButton } from "@/components/common/AddToChannelButton"
import { getVideoEmbedUrl } from "@/lib/videoEmbed"

interface VideoData {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId: string | null
  externalUrl: string | null
  likeCount: number
}

interface Props {
  video: VideoData
  isOwn: boolean
  initialUpvoted: boolean
}

function getEmbedUrl(video: VideoData): string | null {
  if (video.streamId) return `https://iframe.videodelivery.net/${video.streamId}?autoplay=true`
  if (video.externalUrl) {
    const base = getVideoEmbedUrl(video.externalUrl)
    return base.includes("?") ? `${base}&autoplay=1` : `${base}?autoplay=1`
  }
  return null
}

function cfThumb(url: string | null): string | null {
  if (!url || !url.includes("videodelivery.net")) return url
  if (url.includes("width=")) return url
  return url + (url.includes("?") ? "&" : "?") + "width=1280"
}

export function PinnedVideo({ video, isOwn, initialUpvoted }: Props) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = getEmbedUrl(video)
  const thumb = cfThumb(video.thumbnailUrl)

  return (
    <div className="mb-8">
      {/* Label row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-sans text-xs font-normal text-foreground/40">
          <Pin size={10} />
          Featured work
        </span>
        {isOwn && <UnpinButton videoId={video.id} />}
      </div>

      {/* Video — full width, fixed 16/9 */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16/9" }}>
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : embedUrl ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full group"
          >
            {thumb && (
              <Image
                src={thumb}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 100vw, 75vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105">
                <Play size={22} className="ml-1 text-core-black" fill="currentColor" />
              </div>
            </div>
          </button>
        ) : (
          thumb && (
            <Image src={thumb} alt={video.title} fill sizes="(max-width: 768px) 100vw, 75vw" className="object-cover" />
          )
        )}
      </div>

      {/* Title + actions row */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <Link
          href={`/v/${video.id}`}
          className="font-sans font-semibold text-base text-core-black hover:underline leading-snug"
        >
          {video.title}
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <UpvoteButton
            videoId={video.id}
            initialUpvoted={initialUpvoted}
            initialCount={video.likeCount}
          />
          <AddToPlaylistButton
            videoId={video.id}
            triggerClassName="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
          />
          <AddToChannelButton videoId={video.id} />
        </div>
      </div>
    </div>
  )
}
