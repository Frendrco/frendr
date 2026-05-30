"use client"

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { detectProvider, getProviderLabel } from "@/lib/videoEmbed"
import { AddToPlaylistButton } from "./AddToPlaylistButton"

export type VideoCardData = {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId?: string | null
  externalUrl?: string | null
  tags: string[]
  createdAt: Date | string
  user: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

type Props = {
  video: VideoCardData
  showTimestamp?: boolean
  roundedSize?: "xl" | "2xl"
}

export function VideoCard({ video, showTimestamp = false, roundedSize = "xl" }: Props) {
  const initials = video.user.displayName
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  const rounded = roundedSize === "2xl" ? "rounded-2xl" : "rounded-xl"

  return (
    <div className="group flex flex-col gap-2">
      {/* Thumbnail + overlay */}
      <div className={`relative aspect-video overflow-hidden ${rounded} bg-mist-grey`}>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-mist-grey" />
        )}

        {/* Provider badge for external videos */}
        {video.externalUrl && (
          <div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur">
            <span className="font-sans text-[9px] font-medium text-white">
              {getProviderLabel(detectProvider(video.externalUrl))}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          {/* Play link — covers the whole card */}
          <Link
            href={`/v/${video.id}`}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label={`Play ${video.title}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play size={16} className="ml-0.5 text-core-black" fill="currentColor" />
            </div>
          </Link>

          {/* Add to playlist — top-right corner */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <AddToPlaylistButton videoId={video.id} />
          </div>
        </div>
      </div>

      {/* Meta — links to video page */}
      <Link href={`/v/${video.id}`} className="flex items-start gap-2">
        <div className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
          {video.user.avatarUrl ? (
            <Image
              src={video.user.avatarUrl}
              alt={video.user.displayName}
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-sans font-bold text-[9px] text-core-black">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-sans font-medium text-sm text-core-black leading-snug">{video.title}</p>
          <p className="font-sans text-xs text-foreground/40">
            {video.user.displayName}
            {showTimestamp && ` · ${timeAgo(video.createdAt)}`}
          </p>
        </div>
      </Link>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="flex gap-1">
          {video.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 font-sans text-[10px] text-foreground/40">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
