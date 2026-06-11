"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Check, Loader2 } from "lucide-react"

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId: string | null
  externalUrl: string | null
  duration: number | null
  visibility: string
  videoType: string
  slug: string | null
}

export function VideoEditRow({ video }: { video: Video }) {
  const isStream = !!video.streamId

  const initialTime = (() => {
    const m = video.thumbnailUrl?.match(/[?&]time=(\d+(?:\.\d+)?)s?/)
    return m ? parseFloat(m[1]) : 0
  })()

  const [time, setTime] = useState(initialTime)
  const [url, setUrl] = useState(video.thumbnailUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const maxTime = video.duration ?? 60

  const previewUrl = isStream
    ? `https://videodelivery.net/${video.streamId}/thumbnails/thumbnail.jpg?time=${time}s`
    : url || null

  const videoHref = video.slug ? `/v/${video.slug}` : `/v/${video.id}`

  async function resolveUrl(raw: string): Promise<string> {
    const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`

    const vimeoMatch = raw.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoMatch[1]}`)
        const data = await res.json()
        if (data.thumbnail_url) return data.thumbnail_url
      } catch {}
    }

    const isImageUrl = /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(raw)
    if (!isImageUrl && raw.startsWith("http")) {
      try {
        const res = await fetch("/api/admin/resolve-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: raw }),
        })
        const data = await res.json()
        if (data.thumbnailUrl) return data.thumbnailUrl
      } catch {}
    }

    return raw
  }

  async function save() {
    setSaving(true)
    const thumbnailUrl = isStream
      ? `https://videodelivery.net/${video.streamId}/thumbnails/thumbnail.jpg?time=${time}s`
      : await resolveUrl(url.trim())

    if (!isStream && thumbnailUrl !== url.trim()) setUrl(thumbnailUrl)

    await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thumbnailUrl }),
    })
    setSaving(false)
    setSaved(true)
  }

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }, [])

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex gap-4">
        {/* Thumbnail preview */}
        <div className="relative h-[90px] w-40 shrink-0 overflow-hidden rounded-lg bg-mist-grey">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={video.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans font-medium text-sm text-core-black truncate">{video.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-sans text-[10px] text-foreground/40 uppercase tracking-wide">
                  {video.videoType}
                </span>
                <span className="text-foreground/20">·</span>
                <span className="font-sans text-[10px] text-foreground/40 uppercase tracking-wide">
                  {video.visibility}
                </span>
              </div>
            </div>
            <Link
              href={videoHref}
              target="_blank"
              className="shrink-0 flex items-center gap-1 font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
            >
              <ExternalLink size={11} />
              View
            </Link>
          </div>

          {/* Thumbnail editor */}
          {isStream ? (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={maxTime}
                step={0.5}
                value={time}
                onChange={e => { setTime(parseFloat(e.target.value)); setSaved(false) }}
                className="flex-1 accent-spring-green"
              />
              <span className="font-mono text-xs text-foreground/40 shrink-0 w-10 text-right">
                {formatTime(time)}
              </span>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg bg-spring-green text-core-black font-sans font-medium text-xs hover:bg-spring-green/80 disabled:opacity-40 transition-colors shrink-0"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                {saving ? "Saving…" : saved ? "Saved" : "Set thumbnail"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setSaved(false) }}
                placeholder="Paste thumbnail URL or video page URL…"
                className="h-8 flex-1 rounded-lg border border-border bg-white px-3 font-sans text-xs text-core-black placeholder:text-foreground/30 focus:outline-none focus:border-foreground/40"
              />
              <button
                onClick={save}
                disabled={saving || !url.trim()}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-spring-green text-core-black hover:bg-spring-green/80 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              {saved && <span className="font-sans text-xs text-spring-green shrink-0">Saved</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
