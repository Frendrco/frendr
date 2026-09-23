"use client"

import { Upload as TusUpload } from "tus-js-client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, X, Link2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_BATCH = 5
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"]

type VideoType  = "PORTFOLIO" | "RECESS"
type Visibility = "public" | "followers" | "private"

interface QueueItem {
  id:       string
  file:     File
  title:    string
  status:   "pending" | "uploading" | "saving" | "done" | "error"
  progress: number
  error?:   string
}

function toApiVisibility(v: Visibility): "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE" {
  if (v === "public")    return "PUBLIC"
  if (v === "followers") return "FOLLOWERS_ONLY"
  return "PRIVATE"
}

function titleFromFilename(name: string) {
  return name.replace(/\.(mp4|mov|avi)$/i, "").replace(/[-_]+/g, " ").trim()
}

interface UploadClientProps {
  username: string
  initialType?: VideoType
}

export function UploadClient({ username, initialType = "PORTFOLIO" }: UploadClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems]           = useState<QueueItem[]>([])
  const [videoType, setVideoType]   = useState<VideoType>(initialType)
  const [visibility, setVisibility] = useState<Visibility>("public")
  const [dragging, setDragging]     = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  function addFiles(files: File[]) {
    const accepted = files
      .filter((f) => ACCEPTED_VIDEO_TYPES.includes(f.type))
      .slice(0, MAX_BATCH - items.length)
    if (!accepted.length) return
    setError(null)
    setItems((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        title: titleFromFilename(f.name),
        status: "pending" as const,
        progress: 0,
      })),
    ])
  }

  function patch(id: string, p: Partial<QueueItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function publishOne(item: QueueItem): Promise<{ ok: boolean; slug?: string }> {
    try {
      patch(item.id, { status: "uploading" })

      const urlRes = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: item.file.size,
          name:     item.title.trim() || item.file.name,
          filename: item.file.name,
          filetype: item.file.type,
        }),
      })
      if (!urlRes.ok) throw new Error("Could not start the upload")
      const { uploadUrl, uid } = await urlRes.json()

      await new Promise<void>((resolve, reject) => {
        new TusUpload(item.file, {
          uploadUrl,
          chunkSize: 150 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          onError: reject,
          onProgress: (sent, total) =>
            patch(item.id, { progress: Math.round((sent / total) * 100) }),
          onSuccess: () => resolve(),
        }).start()
      })

      patch(item.id, { status: "saving", progress: 100 })
      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId:   uid,
          title:      item.title.trim() || titleFromFilename(item.file.name),
          visibility: toApiVisibility(visibility),
          videoType,
        }),
      })
      if (!saveRes.ok) throw new Error("Could not save the video")
      const video = await saveRes.json() as { id: string; slug?: string | null }

      patch(item.id, { status: "done" })
      return { ok: true, slug: video.slug ?? video.id }
    } catch (err) {
      patch(item.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      })
      return { ok: false }
    }
  }

  async function handlePublish() {
    if (publishing || !items.length) return
    setPublishing(true)
    setError(null)

    const results = await Promise.all(items.map(publishOne))
    setPublishing(false)

    if (!results.every((r) => r.ok)) {
      setError("Some uploads didn't finish. Remove the failed ones and try again.")
      return
    }

    // Land on the live page with the edit sheet already open, so adding detail
    // is a choice rather than a gate on publishing.
    const slug = results.length === 1 ? results[0].slug : null
    router.push(slug ? `/v/${slug}?edit=1` : `/${username}`)
  }

  const canPublish = items.length > 0 && items.every((i) => i.title.trim()) && !publishing

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="display-sm mb-2">Upload</h1>
      <p className="mb-8 font-sans text-sm text-foreground/50">
        Drop a file and give it a title. You can add everything else once it&rsquo;s live.
      </p>

      <div className="mb-6 flex items-center gap-2">
        {(["PORTFOLIO", "RECESS"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setVideoType(t)}
            disabled={publishing}
            className={cn(
              "h-9 rounded-full px-4 font-sans text-sm font-medium transition-colors",
              videoType === t
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-foreground/60 hover:text-foreground"
            )}
          >
            {t === "PORTFOLIO" ? "Portfolio" : "Recess"}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-colors",
          dragging ? "border-spring-green bg-spring-green/5" : "border-border hover:border-foreground/30"
        )}
      >
        <Upload size={24} className="text-foreground/40" />
        <p className="font-sans text-sm font-medium text-foreground">
          Drop a video, or click to choose
        </p>
        <p className="font-sans text-xs text-foreground/40">
          MP4, MOV or AVI &middot; up to {MAX_BATCH} at once
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = "" }}
        />
      </div>

      <Link
        href="/dashboard/import"
        className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        <Link2 size={14} />
        Already on YouTube or Vimeo? Paste a link instead
      </Link>

      {items.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  value={item.title}
                  onChange={(e) => patch(item.id, { title: e.target.value })}
                  placeholder="Title"
                  disabled={publishing}
                  className="min-w-0 flex-1 bg-transparent font-sans text-sm font-medium text-foreground outline-none placeholder:text-foreground/30"
                />
                {item.status === "pending" && !publishing && (
                  <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove">
                    <X size={16} className="text-foreground/30 hover:text-foreground" />
                  </button>
                )}
                {(item.status === "uploading" || item.status === "saving") && (
                  <span className="flex shrink-0 items-center gap-1.5 font-sans text-xs text-foreground/50">
                    <Loader2 size={12} className="animate-spin" />
                    {item.status === "saving" ? "Saving" : `${item.progress}%`}
                  </span>
                )}
                {item.status === "done" && (
                  <span className="shrink-0 font-sans text-xs text-spring-green">Published</span>
                )}
                {item.status === "error" && (
                  <span className="shrink-0 font-sans text-xs text-red-500">{item.error}</span>
                )}
              </div>
              {(item.status === "uploading" || item.status === "saving") && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-spring-green transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/40">
          Who can see it
        </p>
        <div className="flex items-center gap-2">
          {(["public", "followers", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              disabled={publishing}
              className={cn(
                "h-9 rounded-full px-4 font-sans text-sm font-medium transition-colors",
                visibility === v
                  ? "bg-foreground text-background"
                  : "bg-foreground/5 text-foreground/60 hover:text-foreground"
              )}
            >
              {v === "public" ? "Everyone" : v === "followers" ? "Followers" : "Only me"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 font-sans text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handlePublish}
        disabled={!canPublish}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-spring-green px-8 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {publishing ? "Publishing…" : items.length > 1 ? `Publish ${items.length} videos` : "Publish"}
      </button>
    </div>
  )
}
