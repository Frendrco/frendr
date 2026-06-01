"use client"

import { useEffect } from "react"

export function ViewTracker({ videoId }: { videoId: string }) {
  useEffect(() => {
    fetch(`/api/videos/${videoId}/view`, { method: "POST" })
  }, [videoId])

  return null
}
