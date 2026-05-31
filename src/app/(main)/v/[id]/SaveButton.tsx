"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  videoId: string
  initialSaved: boolean
}

export function SaveButton({ videoId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    setSaved((v) => !v)
    try {
      await fetch("/api/playlists/watch-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
    } catch {
      setSaved((v) => !v)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from Watch Later" : "Save to Watch Later"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
        saved
          ? "border-core-black text-core-black"
          : "border-border text-foreground/40 hover:border-foreground/30 hover:text-foreground"
      )}
    >
      <Bookmark size={15} className={saved ? "fill-current" : ""} />
    </button>
  )
}
