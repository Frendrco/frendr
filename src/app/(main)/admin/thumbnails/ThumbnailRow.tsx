"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"

interface Props {
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    user: { displayName: string; username: string }
  }
}

export function ThumbnailRow({ video }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState(video.thumbnailUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!url.trim()) return
    setSaving(true)
    await fetch("/api/admin/set-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id, thumbnailUrl: url.trim() }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
      {/* Thumbnail preview */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-mist-grey">
        {url && (
          <Image src={url} alt={video.title} fill className="object-cover" unoptimized />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans font-medium text-sm text-core-black">{video.title}</p>
        <p className="font-sans text-xs text-foreground/50">@{video.user.username}</p>
        <p className="mt-0.5 font-mono text-[10px] text-foreground/30">{video.id}</p>
      </div>

      {/* URL input + save */}
      <div className="flex items-center gap-2 w-80 shrink-0">
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setSaved(false) }}
          placeholder="Paste thumbnail URL…"
          className="h-9 w-full rounded-lg border border-border bg-white px-3 font-sans text-xs text-core-black placeholder:text-foreground/30 focus:outline-none focus:border-foreground/40"
        />
        <button
          onClick={save}
          disabled={saving || !url.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-spring-green text-core-black transition-colors hover:bg-spring-green/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
        {saved && <span className="font-sans text-xs text-spring-green shrink-0">Saved</span>}
      </div>
    </div>
  )
}
