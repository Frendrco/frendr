import Image from "next/image"
import Link from "next/link"
import { Play, Sparkles } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { detectProvider, getProviderLabel, type Provider } from "@/lib/videoEmbed"
import { AddToPlaylistButton } from "./AddToPlaylistButton"
import { AddToChannelButton } from "./AddToChannelButton"

export type VideoCardData = {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId?: string | null
  externalUrl?: string | null
  featured?: boolean
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
  hideCreator?: boolean
  hideTags?: boolean
  actionsSlot?: React.ReactNode
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "youtube") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#FF0000"/>
      <polygon points="9.5,7 9.5,17 17,12" fill="white"/>
    </svg>
  )
  if (provider === "vimeo") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#1AB7EA"/>
      <polyline points="5,7 12,17 19,7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (provider === "framerate") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#333"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700">F</text>
    </svg>
  )
  return null
}

function cfThumb(url: string | null): string | null {
  if (!url || !url.includes("videodelivery.net")) return url
  if (url.includes("width=")) return url
  return url + (url.includes("?") ? "&" : "?") + "width=1280"
}

export function VideoCard({ video, showTimestamp = false, roundedSize = "xl", hideCreator = false, hideTags = false, actionsSlot }: Props) {
  const initials = video.user.displayName
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  const rounded = roundedSize === "2xl" ? "rounded-2xl" : "rounded-xl"

  return (
    <div className="group flex flex-col gap-2">
      {/* Thumbnail + overlay */}
      <div className={`relative aspect-video overflow-hidden ${rounded} bg-mist-grey`}>
        {video.thumbnailUrl ? (
          <Image
            src={cfThumb(video.thumbnailUrl)!}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-mist-grey" />
        )}

        {/* Frendr Picks badge */}
        {video.featured && (
          <div className="absolute top-2 left-2 z-20 rounded-xl bg-spring-green p-1.5">
            <Sparkles size={10} className="text-core-black" />
          </div>
        )}

        {/* Provider badge for external videos */}
        {video.externalUrl && (
          <div className="absolute bottom-2 left-2 z-20 rounded-lg overflow-hidden shadow-sm">
            <ProviderIcon provider={detectProvider(video.externalUrl)} />
          </div>
        )}

        {/* Base link — always covers the full thumbnail so mobile taps work */}
        <Link
          href={`/v/${video.id}`}
          className="absolute inset-0 z-10"
          aria-label={`Play ${video.title}`}
        />

        {/* Hover overlay — visual only, pointer-events-none */}
        <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none">
          {/* Play icon — visual only */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play size={16} className="ml-0.5 text-core-black" fill="currentColor" />
            </div>
          </div>

          {/* Action buttons — top-right corner (desktop hover only) */}
          <div className="absolute top-2 right-2 z-30 hidden sm:flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <AddToChannelButton videoId={video.id} />
            <AddToPlaylistButton videoId={video.id} />
          </div>

          {/* Owner actions slot — bottom-right corner */}
          {actionsSlot && (
            <div className="absolute bottom-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              {actionsSlot}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only action row — below thumbnail, not covering it */}
      <div className="flex gap-1 sm:hidden">
        <AddToChannelButton videoId={video.id} />
        <AddToPlaylistButton videoId={video.id} />
      </div>

      {/* Meta — links to video page */}
      {hideCreator ? (
        <Link href={`/v/${video.id}`}>
          <p className="truncate font-sans font-medium text-sm text-core-black leading-snug">{video.title}</p>
          {showTimestamp && (
            <p className="font-sans text-xs text-foreground/40">{timeAgo(video.createdAt)}</p>
          )}
        </Link>
      ) : (
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
      )}

      {/* Tags */}
      {!hideTags && video.tags.length > 0 && (
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
