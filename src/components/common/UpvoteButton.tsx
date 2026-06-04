"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  videoId: string
  initialUpvoted: boolean
  initialCount: number
}

export function UpvoteButton({ videoId, initialUpvoted, initialCount }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (loading) return
    setLoading(true)
    setUpvoted((v) => !v)
    setCount((c) => upvoted ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { method: "POST" })
      if (res.ok) {
        const data = await res.json() as { liked: boolean; count: number }
        setUpvoted(data.liked)
        setCount(data.count)
      }
    } catch {
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Upvote"
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border px-3 font-sans text-xs font-medium transition-colors",
        upvoted
          ? "border-spring-green bg-spring-green/10 text-core-black"
          : "border-border text-foreground/40 hover:border-foreground/30 hover:text-foreground"
      )}
    >
      <ChevronUp size={14} strokeWidth={2.5} className={upvoted ? "text-core-black" : ""} />
      <span>{count}</span>
    </button>
  )
}
