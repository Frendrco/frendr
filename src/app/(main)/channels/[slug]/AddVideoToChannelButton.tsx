"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Loader2, Check } from "lucide-react"
import Image from "next/image"

type VideoResult = {
  id: string
  title: string
  thumbnailUrl: string | null
  user: { displayName: string }
  inChannel: boolean
}

type Props = { channelId: string }

export function AddVideoToChannelButton({ channelId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<VideoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/channels/${channelId}/video-search?q=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open, channelId])

  const toggle = async (video: VideoResult) => {
    if (video.inChannel) {
      await fetch(`/api/channels/${channelId}/videos/${video.id}`, { method: "DELETE" })
    } else {
      await fetch(`/api/channels/${channelId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      })
    }
    setResults((prev) => prev.map((v) => v.id === video.id ? { ...v, inChannel: !v.inChannel } : v))
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={() => {
          const next = !open
          if (next && btnRef.current && window.innerWidth < 640) {
            const r = btnRef.current.getBoundingClientRect()
            setDropdownStyle({ position: "fixed", top: r.bottom + 8, left: 16, right: 16, width: "auto" })
          } else {
            setDropdownStyle({})
          }
          setOpen(next)
        }}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-white px-4 font-sans font-medium text-sm text-core-black hover:bg-foreground/5 transition-colors"
      >
        <Plus size={14} />
        Add Video
      </button>

      {open && (
        <div style={dropdownStyle} className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search size={14} className="shrink-0 text-foreground/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="flex-1 bg-transparent font-sans text-sm outline-none placeholder:text-foreground/30"
            />
            {loading && <Loader2 size={14} className="animate-spin text-foreground/40" />}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 && query.trim() && !loading ? (
              <p className="px-3 py-4 font-sans text-xs text-foreground/40">No videos found</p>
            ) : results.length === 0 && !query.trim() ? (
              <p className="px-3 py-4 font-sans text-xs text-foreground/40">Type to search videos</p>
            ) : (
              results.map((video) => (
                <button
                  key={video.id}
                  onClick={() => toggle(video)}
                  className="flex w-full items-center gap-3 px-3 py-2 hover:bg-foreground/4 transition-colors text-left"
                >
                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-mist-grey">
                    {video.thumbnailUrl && (
                      <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm text-core-black">{video.title}</p>
                    <p className="font-sans text-xs text-foreground/40">{video.user.displayName}</p>
                  </div>
                  {video.inChannel && <Check size={14} className="shrink-0 text-spring-green" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
