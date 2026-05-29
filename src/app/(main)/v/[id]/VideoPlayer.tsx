"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Props {
  streamId: string | null
  title: string
  streamReady: boolean
}

export function VideoPlayer({ streamId, title, streamReady }: Props) {
  const router = useRouter()

  // Poll by refreshing the server component until the stream is ready
  useEffect(() => {
    if (streamReady || !streamId) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [streamReady, streamId, router])

  if (!streamId || !streamReady) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-core-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        <p className="font-sans text-sm text-white/40">Processing video… this usually takes a minute</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://iframe.videodelivery.net/${streamId}?autoplay=false&controls=true&muted=false`}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
