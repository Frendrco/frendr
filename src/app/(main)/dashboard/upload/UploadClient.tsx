"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, X, Search, Copy, Check, ArrowLeft, ImageIcon, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  detectProvider,
  getProviderLabel,
  getVideoEmbedUrl,
  getVideoThumbnail,
  type Provider,
} from "@/lib/videoEmbed"

const CATEGORIES = [
  "Motion Design", "Animation", "3D", "Motion Graphics", "VFX",
  "2D Animation", "3D Animation", "3D Type", "Typography",
  "Branding", "Commercial", "Music Video", "Short Film", "Film",
  "Loop", "Experimental", "Stop Motion", "Sound",
  "Blender", "Cinema 4D", "After Effects", "Cavalry", "Houdini",
]

const MAX_CATEGORIES = 5
const DESC_MAX = 500
const FRAME_COUNT = 6

type Mode       = "upload" | "import"
type Tab        = "basics" | "privacy" | "embed"
type Visibility = "public" | "followers" | "private"
type ThumbMode  = "upload" | "frame"

function Toggle({ on, onToggle, label, description }: { on: boolean; onToggle: () => void; label: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={onToggle}
        className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-spring-green" : "bg-border")}
        aria-pressed={on}
      >
        <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      <div>
        <p className="font-sans text-sm font-medium text-core-black">{label}</p>
        {description && <p className="font-sans text-xs text-foreground/40 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

async function extractVideoFrames(videoFile: File): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(videoFile)
    video.src = url
    video.muted = true
    video.crossOrigin = "anonymous"

    const frames: string[] = []
    let index = 0
    let timestamps: number[] = []

    video.addEventListener("loadedmetadata", () => {
      const d = video.duration
      timestamps = Array.from({ length: FRAME_COUNT }, (_, i) => (d * (i + 0.5)) / FRAME_COUNT)
      seekNext()
    })

    function seekNext() {
      if (index >= timestamps.length) {
        URL.revokeObjectURL(url)
        resolve(frames)
        return
      }
      video.currentTime = timestamps[index]
    }

    video.addEventListener("seeked", () => {
      const nativeW = video.videoWidth
      const nativeH = video.videoHeight
      const maxDim = 640
      const scale = Math.min(maxDim / nativeW, maxDim / nativeH, 1)
      const canvas = document.createElement("canvas")
      canvas.width  = Math.round(nativeW * scale)
      canvas.height = Math.round(nativeH * scale)
      canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
      frames.push(canvas.toDataURL("image/jpeg", 0.85))
      index++
      seekNext()
    })

    video.load()
  })
}

export function UploadClient({ username }: { username: string }) {
  const router = useRouter()

  // Source mode
  const [mode, setMode] = useState<Mode>("upload")

  // Upload mode — video file
  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // Upload mode — tabs
  const [tab, setTab] = useState<Tab>("basics")

  // Thumbnail (shared across modes)
  const [thumbMode, setThumbMode]         = useState<ThumbMode>("upload")
  const [thumbnail, setThumbnail]         = useState<string | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [videoFrames, setVideoFrames]     = useState<string[]>([])
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [extracting, setExtracting]       = useState(false)
  const thumbInputRef                     = useRef<HTMLInputElement>(null)

  // Import mode
  const [importUrl, setImportUrl]           = useState("")
  const [importProvider, setImportProvider] = useState<Provider | null>(null)
  const [importEmbedUrl, setImportEmbedUrl] = useState<string | null>(null)
  const [oEmbedLoading, setOEmbedLoading]   = useState(false)
  const [oEmbedSource, setOEmbedSource]     = useState<string | null>(null)

  // Shared metadata
  const [title, setTitle]               = useState("")
  const [description, setDescription]   = useState("")
  const [categories, setCategories]     = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState("")
  const [isPublic, setIsPublic]         = useState(true)

  // Privacy (upload mode only)
  const [visibility, setVisibility]         = useState<Visibility>("public")
  const [password, setPassword]             = useState("")
  const [hideFromFeeds, setHideFromFeeds]   = useState(false)
  const [allowComments, setAllowComments]   = useState(true)
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Embed (upload mode only)
  const [allowEmbedding, setAllowEmbedding] = useState(true)
  const [autoplay, setAutoplay]             = useState(false)
  const [loop, setLoop]                     = useState(false)
  const [showControls, setShowControls]     = useState(true)
  const [copied, setCopied]                 = useState(false)

  // Collaborators
  type CollabUser = { id: string; username: string; displayName: string; avatarUrl: string | null; role: string }
  const [collabs, setCollabs]           = useState<CollabUser[]>([])
  const [collabSearch, setCollabSearch] = useState("")
  const [collabResults, setCollabResults] = useState<Omit<CollabUser, "role">[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const collabDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Submit state
  const [uploading, setUploading]     = useState(false)
  const [progress, setProgress]       = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Extract frames when video file changes
  useEffect(() => {
    if (!file) { setVideoFrames([]); setSelectedFrame(null); return }
    setExtracting(true)
    setVideoFrames([])
    setSelectedFrame(null)
    extractVideoFrames(file)
      .then((frames) => { setVideoFrames(frames); setExtracting(false) })
      .catch(() => setExtracting(false))
  }, [file])

  // Parse import URL as user types, then fetch oEmbed metadata
  useEffect(() => {
    if (!importUrl.trim()) {
      setImportProvider(null)
      setImportEmbedUrl(null)
      setOEmbedSource(null)
      return
    }
    try {
      new URL(importUrl) // throws if invalid
    } catch {
      setImportProvider(null)
      setImportEmbedUrl(null)
      setOEmbedSource(null)
      return
    }

    const provider = detectProvider(importUrl)
    const embed    = getVideoEmbedUrl(importUrl)
    setImportProvider(provider)
    setImportEmbedUrl(embed)

    // Fetch oEmbed for YouTube / Vimeo
    if (provider === "youtube" || provider === "vimeo") {
      setOEmbedLoading(true)
      fetch(`/api/videos/oembed?url=${encodeURIComponent(importUrl)}`)
        .then(r => r.json())
        .then((data: { title?: string | null; thumbnailUrl?: string | null }) => {
          if (data.title)        setTitle(t  => t  || data.title!)
          if (data.thumbnailUrl) setThumbnail(th => th || data.thumbnailUrl!)
          setOEmbedSource(provider === "youtube" ? "YouTube" : "Vimeo")
        })
        .catch(() => {
          // oEmbed failed — fall back to YouTube CDN thumb
          if (provider === "youtube") {
            const autoThumb = getVideoThumbnail(importUrl)
            if (autoThumb) setThumbnail(th => th || autoThumb)
          }
        })
        .finally(() => setOEmbedLoading(false))
    } else {
      setOEmbedSource(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importUrl])

  const searchCollabs = useCallback((q: string) => {
    if (!q.trim()) { setCollabResults([]); return }
    setCollabLoading(true)
    fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setCollabResults(data))
      .catch(() => setCollabResults([]))
      .finally(() => setCollabLoading(false))
  }, [])

  useEffect(() => {
    if (collabDebounce.current) clearTimeout(collabDebounce.current)
    collabDebounce.current = setTimeout(() => searchCollabs(collabSearch), 150)
    return () => { if (collabDebounce.current) clearTimeout(collabDebounce.current) }
  }, [collabSearch, searchCollabs])

  function addCollab(user: Omit<CollabUser, "role">) {
    if (!collabs.find((c) => c.id === user.id)) setCollabs((prev) => [...prev, { ...user, role: "" }])
    setCollabSearch("")
    setCollabResults([])
  }

  function removeCollab(id: string) {
    setCollabs((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCollabRole(id: string, role: string) {
    setCollabs((prev) => prev.map((c) => c.id === id ? { ...c, role } : c))
  }

  function switchMode(next: Mode) {
    setMode(next)
    setUploadError(null)
    setProgress(0)
    setUploading(false)
    if (next === "upload") {
      setImportUrl("")
      setImportProvider(null)
      setImportEmbedUrl(null)
      setOEmbedSource(null)
      setOEmbedLoading(false)
    }
    // Reset shared fields so users start fresh
    setTitle("")
    setDescription("")
    setCategories([])
    setThumbnail(null)
    setSelectedFrame(null)
    setTab("basics")
  }

  const filteredCategories = CATEGORIES.filter(
    (c) => c.toLowerCase().includes(categorySearch.toLowerCase())
  )

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat)
        : prev.length < MAX_CATEGORIES ? [...prev, cat] : prev
    )
  }

  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("video/")) setFile(f)
  }

  function handleVideoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  function handleThumbDrop(e: React.DragEvent) {
    e.preventDefault(); setThumbDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setThumbnail(ev.target?.result as string)
      reader.readAsDataURL(f)
    }
  }

  function handleThumbInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setThumbnail(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  function selectFrame(i: number) {
    setSelectedFrame(i)
    setThumbnail(videoFrames[i])
  }

  function copyEmbed() {
    navigator.clipboard.writeText(
      `<iframe src="https://frendr.com/embed/VIDEO_ID" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true); setUploadError(null); setProgress(0)
    try {
      const urlRes = await fetch("/api/videos/upload-url", { method: "POST" })
      if (!urlRes.ok) throw new Error("Could not get upload URL")
      const { uid, uploadURL } = await urlRes.json() as { uid: string; uploadURL: string }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        })
        xhr.addEventListener("load", () => xhr.status < 400 ? resolve() : reject(new Error("Upload failed")))
        xhr.addEventListener("error", () => reject(new Error("Upload failed")))
        xhr.open("POST", uploadURL)
        const form = new FormData()
        form.append("file", file)
        xhr.send(form)
      })

      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId:      uid,
          title:         title.trim(),
          description:   description || null,
          tags:          categories,
          isPublic,
          thumbnailUrl:  thumbnail || null,
          collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
        }),
      })
      if (!saveRes.ok) throw new Error("Could not save video")
      const video = await saveRes.json() as { id: string }
      router.push(`/v/${video.id}`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
      setProgress(0)
    }
  }

  async function handleImport() {
    if (!importUrl.trim() || !title.trim()) return
    setUploading(true); setUploadError(null)
    try {
      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalUrl:   importUrl.trim(),
          title:         title.trim(),
          description:   description || null,
          tags:          categories,
          isPublic,
          thumbnailUrl:  thumbnail || null,
          collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
        }),
      })
      if (!saveRes.ok) throw new Error("Could not save video")
      const video = await saveRes.json() as { id: string }
      router.push(`/v/${video.id}`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
    }
  }

  const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  // ── Shared metadata fields (used in both modes) ──────────────
  const metadataFields = (
    <>
      {/* Thumbnail */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Thumbnail</label>
          {thumbnail && (
            <button type="button" onClick={() => { setThumbnail(null); setSelectedFrame(null) }}
              className="font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          {/* Mode switcher — only available in upload mode with a file */}
          {mode === "upload" && (
            <div className="flex border-b border-border">
              {([
                { mode: "upload" as ThumbMode, label: "Upload image" },
                { mode: "frame"  as ThumbMode, label: "Select from video" },
              ]).map(({ mode: m, label }) => {
                const disabled = m === "frame" && !file
                return (
                  <button key={m} type="button"
                    onClick={() => !disabled && setThumbMode(m)}
                    disabled={disabled}
                    className={cn(
                      "flex-1 py-2.5 font-sans text-xs font-medium transition-colors",
                      thumbMode === m
                        ? "bg-white text-core-black"
                        : disabled
                        ? "bg-foreground/[0.02] text-foreground/25 cursor-not-allowed"
                        : "bg-foreground/[0.02] text-foreground/40 hover:text-foreground/70"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="p-4">
            {/* ─ Upload image ─ */}
            {(mode === "import" || thumbMode === "upload") && (
              <>
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbInput} />
                {thumbnail ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail} alt="Thumbnail preview" className="max-h-64 w-full object-contain rounded-lg bg-black" />
                    <button type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/50 px-3 py-1.5 font-sans text-xs text-white backdrop-blur hover:bg-black/70 transition-colors"
                    >
                      <ImageIcon size={11} /> Replace
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setThumbDragging(true) }}
                    onDragLeave={() => setThumbDragging(false)}
                    onDrop={handleThumbDrop}
                    onClick={() => thumbInputRef.current?.click()}
                    className={cn(
                      "flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
                      thumbDragging ? "border-spring-green bg-spring-green/5" : "border-border hover:border-foreground/25"
                    )}
                  >
                    <ImageIcon size={20} className="text-foreground/25" />
                    <p className="font-sans text-xs text-foreground/40">
                      {mode === "import" && importProvider === "youtube"
                        ? "Auto-filled from YouTube — click to replace"
                        : "Drop an image or click to browse"}
                    </p>
                    <p className="font-sans text-[11px] text-foreground/25">JPG, PNG, WebP · any aspect ratio</p>
                  </div>
                )}
              </>
            )}

            {/* ─ Select from video (upload mode only) ─ */}
            {mode === "upload" && thumbMode === "frame" && (
              <div className="flex flex-col gap-3">
                {extracting ? (
                  <div className="flex aspect-video items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-core-black" />
                      <p className="font-sans text-xs text-foreground/40">Extracting frames…</p>
                    </div>
                  </div>
                ) : videoFrames.length > 0 ? (
                  <>
                    <div className="relative overflow-hidden rounded-lg bg-black flex items-center justify-center min-h-[120px]">
                      {selectedFrame !== null ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={videoFrames[selectedFrame]} alt="Selected frame" className="max-h-72 w-full object-contain" />
                      ) : (
                        <div className="flex min-h-[120px] items-center justify-center">
                          <p className="font-sans text-xs text-foreground/30">Select a frame below</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {videoFrames.map((src, i) => (
                        <button key={i} type="button" onClick={() => selectFrame(i)}
                          className={cn(
                            "relative overflow-hidden rounded-md border-2 transition-colors bg-black",
                            selectedFrame === i ? "border-core-black" : "border-transparent hover:border-foreground/30"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Frame ${i + 1}`} className="w-full object-contain" />
                        </button>
                      ))}
                    </div>
                    <p className="font-sans text-[11px] text-foreground/30">{FRAME_COUNT} frames sampled evenly across your video</p>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Video Title</label>
          {mode === "import" && oEmbedLoading && (
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-foreground/30">
              <span className="h-3 w-3 animate-spin rounded-full border border-foreground/20 border-t-foreground/50" />
              Fetching from {importProvider === "youtube" ? "YouTube" : "Vimeo"}…
            </span>
          )}
          {mode === "import" && !oEmbedLoading && oEmbedSource && title && (
            <span className="font-sans text-[10px] text-foreground/30">Auto-filled from {oEmbedSource}</span>
          )}
        </div>
        <input className={field} placeholder="Give your video a name that stands out" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Description</label>
          <span className="font-sans text-xs text-foreground/30">{description.length}/{DESC_MAX}</span>
        </div>
        <textarea rows={4} maxLength={DESC_MAX}
          placeholder="Share the story behind this video. What should viewers know before watching?"
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
        />
      </div>

      {/* Credits / Collaborators */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Credits</label>
        {collabs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {collabs.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.06] pl-1.5 pr-2.5 py-1 font-sans text-xs text-core-black self-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden bg-spring-green">
                  {c.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.avatarUrl} alt={c.displayName} className="h-full w-full object-cover" />
                    : <span className="font-bold text-[8px] text-core-black">{c.displayName[0].toUpperCase()}</span>
                  }
                </span>
                {c.displayName}
                <span className="text-foreground/30">·</span>
                <input
                  type="text"
                  value={c.role}
                  onChange={(e) => updateCollabRole(c.id, e.target.value)}
                  placeholder="Role…"
                  className="w-20 bg-transparent placeholder:text-foreground/35 text-core-black focus:outline-none"
                />
                <button type="button" onClick={() => removeCollab(c.id)} className="text-foreground/40 hover:text-foreground transition-colors"><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 h-11">
            <Search size={13} className="shrink-0 text-foreground/30" />
            <input
              className="flex-1 bg-transparent font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
              placeholder="Search by name or @handle…"
              value={collabSearch}
              onChange={(e) => setCollabSearch(e.target.value)}
            />
            {collabLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-foreground/40 shrink-0" />}
          </div>
          {collabResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {collabResults
                .filter((r) => !collabs.find((c) => c.id === r.id))
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addCollab(r)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-foreground/4 transition-colors"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden bg-spring-green">
                      {r.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={r.avatarUrl} alt={r.displayName} className="h-full w-full object-cover" />
                        : <span className="font-bold text-[9px] text-core-black">{r.displayName[0].toUpperCase()}</span>
                      }
                    </span>
                    <div className="text-left">
                      <p className="font-sans text-sm font-medium text-core-black">{r.displayName}</p>
                      <p className="font-sans text-xs text-foreground/40">@{r.username}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Categories</label>
          <span className="font-sans text-xs text-foreground/30">{categories.length}/{MAX_CATEGORIES}</span>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span key={cat} className="inline-flex items-center gap-1 rounded-full border border-core-black bg-core-black px-3 py-0.5 font-sans text-xs font-medium text-white">
                {cat}
                <button type="button" onClick={() => toggleCategory(cat)} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 h-9">
            <Search size={13} className="shrink-0 text-foreground/30" />
            <input className="flex-1 bg-transparent font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
              placeholder="Search categories…" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {filteredCategories.map((cat) => {
              const on    = categories.includes(cat)
              const maxed = !on && categories.length >= MAX_CATEGORIES
              return (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} disabled={maxed}
                  className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                    on ? "border-core-black bg-core-black text-white"
                      : maxed ? "border-border text-foreground/25 cursor-not-allowed"
                      : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                  )}
                >{cat}</button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Make public */}
      <Toggle on={isPublic} onToggle={() => setIsPublic((v) => !v)} label="Make it public"
        description="Your video will appear in the Discover feed and on your profile." />
    </>
  )

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">

        {/* Back */}
        <Link href={`/${username}`} className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
          <ArrowLeft size={13} /> Back to My Profile
        </Link>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-sans font-bold text-2xl text-core-black">
            {mode === "upload" ? "Upload a new video" : "Import from another platform"}
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground/50">
            {mode === "upload"
              ? "Share your work with the frendr community."
              : "Bring your Vimeo, YouTube, or Framerate work to your Frendr profile."}
          </p>
        </div>

        {/* Source toggle */}
        <div className="mb-8 inline-flex rounded-full border border-border p-1 gap-1">
          {([
            { value: "upload" as Mode, icon: <Upload size={13} />,  label: "Upload Video" },
            { value: "import" as Mode, icon: <Link2 size={13} />,   label: "Import from URL" },
          ]).map(({ value, icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => mode !== value && switchMode(value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-4 font-sans font-medium text-sm transition-colors",
                mode === value
                  ? "bg-core-black text-white"
                  : "text-foreground/50 hover:text-foreground"
              )}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ══ UPLOAD MODE ══════════════════════════════════════ */}
        {mode === "upload" && (
          <>
            {/* Tabs */}
            <div className="mb-8 flex gap-8 border-b border-border">
              {(["basics", "privacy", "embed"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("pb-3 font-sans font-medium text-sm capitalize border-b-2 -mb-px transition-colors",
                    tab === t ? "border-core-black text-core-black" : "border-transparent text-foreground/40 hover:text-foreground/70"
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Basics ── */}
            {tab === "basics" && (
              <div className="flex flex-col gap-6">
                {/* Video drop zone */}
                <div>
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoInput} />
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleVideoDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    className={cn(
                      "relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 transition-all duration-150",
                      file ? "border-border cursor-default"
                        : dragging ? "border-spring-green bg-spring-green/5 scale-[1.005] cursor-copy"
                        : "border-dashed border-border bg-foreground/[0.015] hover:border-foreground/25 hover:bg-foreground/[0.03] cursor-pointer"
                    )}
                  >
                    {file ? (
                      <div className="flex flex-col items-center gap-3 px-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spring-green/15">
                          <Upload size={20} className="text-spring-green" />
                        </div>
                        <div>
                          <p className="font-sans font-medium text-sm text-core-black">{file.name}</p>
                          <p className="font-sans text-xs text-foreground/40 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setThumbnail(null) }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                        >
                          <X size={11} /> Change file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                          <Upload size={20} className="text-foreground/35" />
                        </div>
                        <div className="text-center">
                          <p className="font-sans font-medium text-sm text-core-black">{dragging ? "Drop to upload" : "Drop your video here"}</p>
                          <p className="font-sans text-xs text-foreground/40 mt-0.5">or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-center font-sans text-[11px] text-foreground/30">Up to 2 GB · MP4, MOV, AVI, WMV</p>
                </div>

                {metadataFields}
              </div>
            )}

            {/* ── Privacy ── */}
            {tab === "privacy" && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Who can see this</p>
                  {([
                    { value: "public",    label: "Everyone",       desc: "Visible to all visitors and in the Discover feed" },
                    { value: "followers", label: "Followers only", desc: "Only people who follow you can watch" },
                    { value: "private",   label: "Only me",        desc: "Hidden from everyone except you" },
                  ] as const).map(({ value, label, desc }) => (
                    <button key={value} type="button" onClick={() => setVisibility(value)}
                      className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        visibility === value ? "border-core-black bg-foreground/[0.02]" : "border-border hover:border-foreground/30"
                      )}
                    >
                      <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        visibility === value ? "border-core-black bg-core-black" : "border-border"
                      )}>
                        {visibility === value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-sans font-medium text-sm text-core-black">{label}</p>
                        <p className="font-sans text-xs text-foreground/40 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Password protection</p>
                  <input className={field} type="password" placeholder="Leave blank to disable" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="font-sans text-xs text-foreground/30">Anyone with the link will need this password to watch, regardless of visibility.</p>
                </div>
                <div className="flex flex-col gap-5">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Permissions</p>
                  <Toggle on={hideFromFeeds}  onToggle={() => setHideFromFeeds((v) => !v)}  label="Hide from Discover feed" description="Your video won't appear in feeds but can still be shared via link." />
                  <Toggle on={allowComments}  onToggle={() => setAllowComments((v) => !v)}  label="Allow comments" />
                  <Toggle on={allowDownloads} onToggle={() => setAllowDownloads((v) => !v)} label="Allow downloads" description="Viewers can download the original file." />
                </div>
              </div>
            )}

            {/* ── Embed ── */}
            {tab === "embed" && (
              <div className="flex flex-col gap-8">
                <div className="rounded-xl border border-border p-5">
                  <Toggle on={allowEmbedding} onToggle={() => setAllowEmbedding((v) => !v)}
                    label="Allow embedding on other sites"
                    description="Let anyone embed your video player on their website or blog." />
                </div>
                <div className={cn("flex flex-col gap-5 transition-opacity duration-200", !allowEmbedding && "pointer-events-none opacity-30")}>
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Player options</p>
                  <Toggle on={autoplay}     onToggle={() => setAutoplay((v) => !v)}     label="Autoplay"             description="Video starts playing as soon as it loads." />
                  <Toggle on={loop}         onToggle={() => setLoop((v) => !v)}          label="Loop"                 description="Replay automatically when the video ends." />
                  <Toggle on={showControls} onToggle={() => setShowControls((v) => !v)} label="Show player controls" description="Display play, pause, and volume controls to viewers." />
                </div>
                <div className={cn("flex flex-col gap-2 transition-opacity duration-200", !allowEmbedding && "pointer-events-none opacity-30")}>
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Embed code</p>
                  <div className="relative">
                    <pre className="w-full overflow-x-auto rounded-xl border border-border bg-foreground/[0.02] px-4 py-4 font-mono text-xs text-foreground/50 leading-relaxed whitespace-pre">{`<iframe
  src="https://frendr.com/embed/VIDEO_ID"
  width="640" height="360"
  frameborder="0"
  allowfullscreen
></iframe>`}</pre>
                    <button type="button" onClick={copyEmbed}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      {copied ? <Check size={12} className="text-spring-green" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="font-sans text-xs text-foreground/30">The embed code becomes active once your video is published.</p>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-foreground/50">
                    {progress < 100 ? `Uploading… ${progress}%` : "Processing…"}
                  </span>
                  <span className="font-sans text-xs text-foreground/30">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  {progress === 0 ? (
                    <div className="h-full w-full rounded-full bg-spring-green/50 animate-pulse" />
                  ) : (
                    <div className="h-full rounded-full bg-spring-green transition-all duration-500" style={{ width: `${progress}%` }} />
                  )}
                </div>
              </div>
            )}

            {uploadError && <p className="mt-4 font-sans text-xs text-red-500">{uploadError}</p>}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
              <Link href={`/${username}`} className="h-10 px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || !title.trim() || uploading}
                className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {uploading ? (progress < 100 ? "Uploading…" : "Processing…") : "Upload Video"}
              </button>
            </div>
          </>
        )}

        {/* ══ IMPORT MODE ══════════════════════════════════════ */}
        {mode === "import" && (
          <div className="flex flex-col gap-6">

            {/* URL input */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-foreground/50">Video URL</label>
              <div className="relative">
                <Link2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
                <input
                  className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                  placeholder="Paste a YouTube, Vimeo, or Framerate link…"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
                {importProvider && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-core-black px-2.5 py-0.5">
                    <span className="font-sans text-[10px] font-medium text-white">
                      {getProviderLabel(importProvider)}
                    </span>
                  </div>
                )}
              </div>
              {importUrl && !importEmbedUrl && (
                <p className="font-sans text-xs text-foreground/40">Paste a full YouTube, Vimeo, or Framerate URL to preview.</p>
              )}
            </div>

            {/* Live embed preview */}
            {importEmbedUrl && (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="relative aspect-video w-full bg-core-black">
                  <iframe
                    src={importEmbedUrl}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Metadata — only show once a valid URL is detected */}
            {importEmbedUrl && metadataFields}

            {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

            <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-5">
              <Link href={`/${username}`} className="h-10 px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importEmbedUrl || !title.trim() || uploading}
                className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {uploading ? "Saving…" : "Import Video"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
