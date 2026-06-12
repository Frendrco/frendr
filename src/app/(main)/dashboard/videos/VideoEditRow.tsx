"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Check, Loader2 } from "lucide-react"
import { VideoOwnerActions } from "@/components/video/VideoOwnerActions"

interface Collaborator {
  userId: string
  role: string | null
  status: string
  user: { username: string; displayName: string; avatarUrl: string | null }
}

interface Video {
  id: string
  slug: string | null
  title: string
  description: string | null
  thumbnailUrl: string | null
  streamId: string | null
  externalUrl: string | null
  duration: number | null
  visibility: string
  videoType: string
  tags: string[]
  categories: string[]
  password: string | null
  hideFromFeeds: boolean
  allowComments: boolean
  allowDownloads: boolean
  embedAutoplay: boolean
  embedLoop: boolean
  embedShowControls: boolean
  allowEmbedding: boolean
  collaborators: Collaborator[]
}

export function VideoEditRow({ video, username }: { video: Video; username: string }) {
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
        <div className="relative h-[70px] w-24 sm:h-[90px] sm:w-40 shrink-0 overflow-hidden rounded-lg bg-mist-grey">
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
            <div className="flex items-center gap-2 shrink-0">
              <VideoOwnerActions
                videoId={video.id}
                username={username}
                streamId={video.streamId}
                streamDuration={video.duration}
                videoType={video.videoType}
                initialTitle={video.title}
                initialDescription={video.description ?? ""}
                initialTags={video.tags}
                initialCategories={video.categories}
                initialThumbnailUrl={video.thumbnailUrl}
                initialVisibility={video.visibility as "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE"}
                initialHasPassword={!!video.password}
                initialHideFromFeeds={video.hideFromFeeds}
                initialAllowComments={video.allowComments}
                initialAllowDownloads={video.allowDownloads}
                initialCollaborators={video.collaborators.map(c => ({
                  userId: c.userId,
                  username: c.user.username,
                  displayName: c.user.displayName,
                  avatarUrl: c.user.avatarUrl,
                  role: c.role,
                  status: c.status,
                }))}
                initialEmbedAutoplay={video.embedAutoplay}
                initialEmbedLoop={video.embedLoop}
                initialEmbedShowControls={video.embedShowControls}
                initialAllowEmbedding={video.allowEmbedding}
              />
              <Link
                href={videoHref}
                target="_blank"
                className="flex items-center gap-1 font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
              >
                <ExternalLink size={11} />
                <span className="hidden sm:inline">View</span>
              </Link>
            </div>
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
