"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Play, Heart, MessageSquare, Trash2 } from "lucide-react"

type LoadState = "idle" | "loading" | "ready"

type Props = {
  id:           string
  title:        string
  riveUrl:      string
  previewUrl?:  string | null
  likeCount:    number
  commentCount: number
  isOwner?:     boolean
  priority?:    boolean
  user: {
    username:    string
    displayName: string
    avatarUrl:   string | null
  }
}

export function RiveCard({ id, title, riveUrl, previewUrl, likeCount, commentCount, isOwner, priority = false, user }: Props) {
  const router = useRouter()
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [deleting, setDeleting] = useState(false)

  function handleClick() {
    if (loadState === "idle") setLoadState("loading")
  }

  function handleIframeLoad() {
    setLoadState("ready")
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!window.confirm("Delete this post?")) return
    setDeleting(true)
    await fetch(`/api/threads/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-background flex flex-col">
      {/* Iframe / placeholder */}
      <div
        className="relative aspect-[4/3] bg-mist-grey cursor-crosshair"
        onClick={handleClick}
      >
        {/* Still frame + play overlay — shown while idle */}
        {loadState === "idle" && (
          <div className="absolute inset-0 group/card">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-mist-grey" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-core-black/0 group-hover/card:bg-core-black/20 transition-colors duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                <Play size={18} className="text-foreground translate-x-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Spinner — shown while iframe is loading */}
        {loadState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-core-black/10 border-t-core-black/40 animate-spin" />
          </div>
        )}

        {/* Iframe — mounted on click, revealed when ready */}
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
            <Image src={user.avatarUrl} alt={user.displayName} width={24} height={24} sizes="24px" className="h-full w-full object-cover" />
          ) : (
            <span className="font-sans font-bold text-[8px] text-core-black">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-foreground truncate leading-tight">{title}</p>
          <p className="font-sans text-xs text-foreground/40 leading-tight">@{user.username}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <Heart size={11} />{likeCount}
          </span>
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <MessageSquare size={12} />{commentCount}
          </span>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete post"
              className="text-foreground/30 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </Link>
    </div>
  )
}
