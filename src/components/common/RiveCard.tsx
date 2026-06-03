"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, ChevronUp, MessageSquare } from "lucide-react"

type LoadState = "idle" | "preloading" | "loading" | "ready"

type Props = {
  id:           string
  title:        string
  riveUrl:      string
  voteCount:    number
  commentCount: number
  user: {
    username:    string
    displayName: string
    avatarUrl:   string | null
  }
}

export function RiveCard({ id, title, riveUrl, voteCount, commentCount, user }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadState((prev) => prev === "idle" ? "preloading" : prev)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleMouseEnter() {
    setLoadState((prev) => {
      if (prev === "ready") return prev
      return "loading"
    })
  }

  function handleIframeLoad() {
    setLoadState("ready")
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-white flex flex-col">
      {/* Iframe / placeholder */}
      <div
        ref={cardRef}
        className="relative aspect-[4/3] bg-mist-grey cursor-crosshair"
        onMouseEnter={handleMouseEnter}
      >
        {/* Play icon — shown while idle or preloading */}
        {(loadState === "idle" || loadState === "preloading") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-core-black/8 transition-transform group-hover:scale-110">
              <Play size={18} className="text-core-black/30 translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Spinner — shown while loading (hovered but iframe not ready) */}
        {loadState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-core-black/10 border-t-core-black/40 animate-spin" />
          </div>
        )}

        {/* Iframe — mounted once preloading starts, revealed on ready */}
        {loadState !== "idle" && (
          <iframe
            src={riveUrl}
            className={[
              "absolute inset-0 h-full w-full border-0 transition-opacity duration-500",
              loadState === "ready" ? "opacity-100" : "opacity-0 pointer-events-none",
            ].join(" ")}
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        )}
      </div>

      {/* Meta bar */}
      <Link
        href={`/rive/${id}`}
        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-foreground/[0.03] transition-colors"
      >
        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} width={24} height={24} className="h-full w-full object-cover" />
          ) : (
            <span className="font-sans font-bold text-[8px] text-core-black">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-core-black truncate leading-tight">{title}</p>
          <p className="font-sans text-xs text-foreground/40 leading-tight">@{user.username}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <ChevronUp size={12} />{voteCount}
          </span>
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <MessageSquare size={12} />{commentCount}
          </span>
        </div>
      </Link>
    </div>
  )
}
