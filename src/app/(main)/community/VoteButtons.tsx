"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  threadId?: string
  commentId?: string
  initialCount: number
  initialVote: 1 | -1 | 0
}

export function VoteButtons({ threadId, commentId, initialCount, initialVote }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [vote, setVote] = useState<1 | -1 | 0>(initialVote)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: 1 | -1) {
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (loading) return
    setLoading(true)

    // Optimistic update
    if (vote === value) {
      setCount(c => c - value)
      setVote(0)
    } else if (vote !== 0) {
      setCount(c => c + value * 2)
      setVote(value)
    } else {
      setCount(c => c + value)
      setVote(value)
    }

    try {
      const url = threadId
        ? `/api/threads/${threadId}/vote`
        : `/api/comments/${commentId}/vote`
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
    } catch {
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded transition-colors",
          vote === 1
            ? "text-spring-green"
            : "text-foreground/30 hover:text-foreground/70"
        )}
      >
        <ChevronUp size={16} strokeWidth={2.5} />
      </button>
      <span className={cn(
        "w-6 text-center font-sans text-xs font-medium tabular-nums",
        vote !== 0 ? "text-foreground" : "text-foreground/40"
      )}>
        {count}
      </span>
      <button
        onClick={() => handleVote(-1)}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded transition-colors",
          vote === -1
            ? "text-red-400"
            : "text-foreground/30 hover:text-foreground/70"
        )}
      >
        <ChevronDown size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
