"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, X, Search, Copy, Check, ArrowLeft, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Motion Design", "Animation", "3D", "Typography", "Branding", "Film",
  "Motion Graphics", "VFX", "Loop", "Experimental", "Sound",
  "Documentary", "Short Film", "Music Video", "Commercial",
  "Stop Motion", "Live Action", "2D Animation", "3D Animation",
  "Graphic Design", "Illustration", "Photography", "UX/UI", "3D Type",
]

const MAX_CATEGORIES = 5
const DESC_MAX = 150
const FRAME_COUNT = 6

type Tab = "basics" | "privacy" | "embed"
type Visibility = "public" | "followers" | "private"
type ThumbMode = "upload" | "frame"

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
      const canvas = document.createElement("canvas")
      canvas.width = 320
      canvas.height = 180
      canvas.getContext("2d")!.drawImage(video, 0, 0, 320, 180)
      frames.push(canvas.toDataURL("image/jpeg", 0.85))
      index++
      seekNext()
    })

    video.load()
  })
}

export function UploadClient({ username }: { username: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("basics")

  // Video file
  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // Thumbnail
  const [thumbMode, setThumbMode]         = useState<ThumbMode>("upload")
  const [thumbnail, setThumbnail]         = useState<string | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [videoFrames, setVideoFrames]     = useState<string[]>([])
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [extracting, setExtracting]       = useState(false)
  const thumbInputRef                     = useRef<HTMLInputElement>(null)

  // Basics
  const [title, setTitle]               = useState("")
  const [description, setDescription]   = useState("")
  const [categories, setCategories]     = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState("")
  const [isPublic, setIsPublic]         = useState(true)

  // Privacy
  const [visibility, setVisibility]         = useState<Visibility>("public")
  const [password, setPassword]             = useState("")
  const [hideFromFeeds, setHideFromFeeds]   = useState(false)
  const [allowComments, setAllowComments]   = useState(true)
  const [allowDownloads, setAllowDownloads] = useState(false)

  // Embed
  const [allowEmbedding, setAllowEmbedding] = useState(true)
  const [autoplay, setAutoplay]             = useState(false)
  const [loop, setLoop]                     = useState(false)
  const [showControls, setShowControls]     = useState(true)
  const [copied, setCopied]                 = useState(false)

  // Upload state
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Extract frames whenever the video file changes
  useEffect(() => {
    if (!file) { setVideoFrames([]); setSelectedFrame(null); return }
    setExtracting(true)
    setVideoFrames([])
    setSelectedFrame(null)
    extractVideoFrames(file)
      .then((frames) => { setVideoFrames(frames); setExtracting(false) })
      .catch(() => setExtracting(false))
  }, [file])

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
    setUploading(true)
    setUploadError(null)
    setProgress(0)

    try {
      // 1. Get a direct-upload URL from our API
      const urlRes = await fetch("/api/videos/upload-url", { method: "POST" })
      if (!urlRes.ok) throw new Error("Could not get upload URL")
      const { uid, uploadURL } = await urlRes.json() as { uid: string; uploadURL: string }

      // 2. Upload the file directly to Cloudflare via XHR so we can track progress
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

      // 3. Save the video record in our DB
      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId:    uid,
          title:       title.trim(),
          description: description || null,
          tags:        categories,
          isPublic,
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

  const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">

        {/* Back */}
        <Link href={`/${username}`} className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
          <ArrowLeft size={13} /> Back to My Profile
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl text-core-black">Upload a new video</h1>
          <p className="mt-1 font-sans text-sm text-foreground/50">Share your work with the frendr community.</p>
        </div>

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

            {/* ── Thumbnail ── */}
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

                {/* Mode switcher */}
                <div className="flex border-b border-border">
                  {([
                    { mode: "upload" as ThumbMode, label: "Upload image" },
                    { mode: "frame"  as ThumbMode, label: "Select from video" },
                  ]).map(({ mode, label }) => {
                    const disabled = mode === "frame" && !file
                    return (
                      <button key={mode} type="button"
                        onClick={() => !disabled && setThumbMode(mode)}
                        disabled={disabled}
                        className={cn(
                          "flex-1 py-2.5 font-sans text-xs font-medium transition-colors",
                          thumbMode === mode
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

                <div className="p-4">
                  {/* ─ Upload image mode ─ */}
                  {thumbMode === "upload" && (
                    <>
                      <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbInput} />
                      {thumbnail ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbnail} alt="Thumbnail preview" className="w-full aspect-video object-cover rounded-lg" />
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
                          <p className="font-sans text-xs text-foreground/40">Drop an image or click to browse</p>
                          <p className="font-sans text-[11px] text-foreground/25">JPG, PNG, WebP · 16:9 recommended</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ─ Select from video mode ─ */}
                  {thumbMode === "frame" && (
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
                          {/* Preview of selected frame */}
                          <div className="relative overflow-hidden rounded-lg bg-foreground/[0.02]">
                            {selectedFrame !== null ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={videoFrames[selectedFrame]} alt="Selected frame" className="w-full aspect-video object-cover" />
                            ) : (
                              <div className="flex aspect-video items-center justify-center">
                                <p className="font-sans text-xs text-foreground/30">Select a frame below</p>
                              </div>
                            )}
                          </div>

                          {/* Frame strip */}
                          <div className="grid grid-cols-6 gap-1.5">
                            {videoFrames.map((src, i) => (
                              <button key={i} type="button" onClick={() => selectFrame(i)}
                                className={cn(
                                  "relative overflow-hidden rounded-md border-2 transition-colors",
                                  selectedFrame === i ? "border-core-black" : "border-transparent hover:border-foreground/30"
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`Frame ${i + 1}`} className="aspect-video w-full object-cover" />
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
              <label className="font-sans text-xs font-medium text-foreground/50">Video Title</label>
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
              <div
                className="h-full rounded-full bg-spring-green transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <p className="mt-4 font-sans text-xs text-red-500">{uploadError}</p>
        )}

        {/* Footer */}
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

      </div>
    </div>
  )
}
