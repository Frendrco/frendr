"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

type LikedByUser = { username: string; displayName: string; avatarUrl: string | null }

interface Props {
  threadId: string
  initialLiked: boolean
  initialCount: number
  initialLikedBy?: LikedByUser[]
}

export function ThreadLikeButton({ threadId, initialLiked, initialCount, initialLikedBy = [] }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [likedBy, setLikedBy] = useState<LikedByUser[]>(initialLikedBy)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function handleClick() {
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (loading) return
    setLoading(true)
    setLiked(v => !v)
    setCount(c => liked ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/threads/${threadId}/like`, { method: "POST" })
      if (res.ok) {
        const data = await res.json() as { liked: boolean; count: number; likedBy: LikedByUser[] }
        setLiked(data.liked)
        setCount(data.count)
        setLikedBy(data.likedBy)
      }
    } catch {
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const tooltipNames = likedBy.slice(0, 5).map(u => u.displayName)
  const extra = likedBy.length > 5 ? ` +${likedBy.length - 5}` : ""
  const tooltipText = tooltipNames.length > 0 ? tooltipNames.join(", ") + extra : null

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Like"
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 font-sans text-xs font-medium transition-colors",
          liked
            ? "border-spring-green bg-spring-green/10 text-foreground"
            : "border-border text-foreground/40 hover:border-foreground/30 hover:text-foreground"
        )}
      >
        <Heart
          size={14}
          strokeWidth={2}
          className={cn(liked ? "fill-current text-foreground" : "")}
        />
        <span>{count}</span>
      </button>

      {hovered && tooltipText && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-core-black dark:bg-white px-2.5 py-1.5 font-sans text-xs text-white dark:text-core-black shadow-lg z-50">
          {tooltipText}
        </div>
      )}
    </div>
  )
}
