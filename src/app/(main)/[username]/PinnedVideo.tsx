"use client"

import { useState } from "react"
import Image from "next/image"
import { Pin, Play } from "lucide-react"
import { UnpinButton } from "./UnpinButton"
import { getVideoEmbedUrl } from "@/lib/videoEmbed"

interface VideoData {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId: string | null
  externalUrl: string | null
}

interface Props {
  video: VideoData
  isOwn: boolean
}

function getEmbedUrl(video: VideoData): string | null {
  if (video.streamId) return `https://iframe.videodelivery.net/${video.streamId}?autoplay=true`
  if (video.externalUrl) {
    const base = getVideoEmbedUrl(video.externalUrl)
    return base.includes("?") ? `${base}&autoplay=1` : `${base}?autoplay=1`
  }
  return null
}

export function PinnedVideo({ video, isOwn }: Props) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = getEmbedUrl(video)

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
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
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
          video.thumbnailUrl && (
            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
          )
        )}
      </div>

      {/* Title below video */}
      <p className="mt-2 font-sans font-medium text-sm text-core-black">{video.title}</p>
    </div>
  )
}
