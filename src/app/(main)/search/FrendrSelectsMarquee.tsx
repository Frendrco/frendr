"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useEffect, useRef } from "react"

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  featured?: boolean
  user: { username: string; displayName: string }
}

export function FrendrSelectsMarquee({ videos }: { videos: Video[] }) {
  const items = [...videos, ...videos]
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startScroll() {
    if (rafRef.current) return
    function tick() {
      const el = containerRef.current
      if (!el) return
      el.scrollLeft += 0.5
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft -= el.scrollWidth / 2
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function stopScroll() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
  }

  useEffect(() => {
    startScroll()
    return () => stopScroll()
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 md:-mx-6"
      onMouseEnter={stopScroll}
      onMouseLeave={startScroll}
      onTouchStart={stopScroll}
      onTouchEnd={() => {
        resumeTimerRef.current = setTimeout(startScroll, 2000)
      }}
    >
      {items.map((video, i) => (
        <Link
          key={`${video.id}-${i}`}
          href={`/v/${video.id}`}
          className="shrink-0 group px-2 w-52 sm:w-64"
        >
          <div className="aspect-video w-full overflow-hidden rounded-xl mb-3 bg-mist-grey relative transition-opacity group-hover:opacity-90">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                sizes="(max-width: 640px) 208px, 256px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-mist-grey" />
            )}
            <div className="absolute top-2 left-2 z-10 rounded-xl bg-spring-green p-1.5">
              <Sparkles size={10} className="text-core-black" />
            </div>
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
  )
}
