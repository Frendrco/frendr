"use client"

import Image from "next/image"
import Link from "next/link"

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  user: { username: string; displayName: string }
}

export function FrendrSelectsMarquee({ videos }: { videos: Video[] }) {
  // Duplicate the list so the second copy seamlessly follows the first
  const items = [...videos, ...videos]

  return (
    <div className="overflow-hidden -mx-4 md:-mx-6">
      <div
        className="flex"
        style={{ animation: "marquee 35s linear infinite", width: "max-content" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.animationPlayState = "paused" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.animationPlayState = "running" }}
      >
        {items.map((video, i) => (
          <Link
            key={`${video.id}-${i}`}
            href={`/v/${video.id}`}
            className="shrink-0 group px-2 w-64"
          >
            <div className="aspect-video w-full overflow-hidden rounded-xl mb-3 bg-mist-grey relative transition-opacity group-hover:opacity-90">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-mist-grey" />
              )}
            </div>
            <p className="font-sans font-medium text-sm text-foreground leading-snug line-clamp-1">
              {video.title}
            </p>
            <p className="font-sans text-xs text-foreground/50 mt-0.5">
              {video.user.displayName}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
