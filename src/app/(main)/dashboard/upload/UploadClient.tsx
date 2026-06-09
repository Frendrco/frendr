"use client"

import { Upload as TusUpload } from "tus-js-client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, X, Search, Copy, Check, ArrowLeft, ImageIcon, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  detectProvider,
  getDropboxRawUrl,
  getProviderLabel,
  getVideoEmbedUrl,
  getVideoThumbnail,
  type Provider,
} from "@/lib/videoEmbed"
import { CONTENT_TAGS, TOOL_TAGS, VIDEO_TAGS } from "@/lib/categories"

const MAX_CATEGORIES = 3
const MAX_TAGS = 5
const MAX_RECESS_TOOLS = 3
const MAX_BATCH      = 5
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"]
const DESC_MAX = 1000
const FRAME_COUNT = 6

type Mode       = "upload" | "import"
type Tab        = "basics" | "privacy" | "embed"
type VideoType  = "PORTFOLIO" | "RECESS" | "INTERACTIVE"

interface BulkItem {
  id:            string
  url:           string
  provider:      Provider | null
  title:         string
  description:   string
  thumbnailUrl:  string | null
  status:        "idle" | "loading" | "ready" | "error"
  errorMessage?: string
}
interface BatchItem {
  id:       string
  file:     File
  title:    string
  status:   "pending" | "uploading" | "saving" | "done" | "error"
  progress: number
  error?:   string
}
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
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(videoFile)
    video.src = url
    video.muted = true
    video.preload = "metadata"

    const cleanup = () => URL.revokeObjectURL(url)

    video.addEventListener("error", () => { cleanup(); reject(new Error("Video load failed")) })

    const frames: string[] = []
    let index = 0
    let timestamps: number[] = []

    video.addEventListener("loadedmetadata", () => {
      const d = video.duration
      if (!d || !isFinite(d)) { cleanup(); resolve([]); return }
      timestamps = Array.from({ length: FRAME_COUNT }, (_, i) => (d * (i + 0.5)) / FRAME_COUNT)
      seekNext()
    })

    function seekNext() {
      if (index >= timestamps.length) {
        cleanup()
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

interface UploadClientProps {
  username: string
  initialType?: VideoType
  isPro?: boolean
  uploadedSeconds?: number
  freeSeconds?: number
  isAtLimit?: boolean
  justUpgraded?: boolean
}

export function UploadClient({
  username,
  initialType = "PORTFOLIO",
  isPro = false,
  uploadedSeconds = 0,
  freeSeconds = 600,
  isAtLimit = false,
  justUpgraded = false,
}: UploadClientProps) {
  const router = useRouter()

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(isAtLimit)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  async function startCheckout() {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setCheckoutLoading(false)
    }
  }

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

  // Import mode — bulk items
  const newBulkItem = (): BulkItem => ({
    id: crypto.randomUUID(), url: "", provider: null, title: "", description: "", thumbnailUrl: null, status: "idle",
  })
  const [bulkItems, setBulkItems] = useState<BulkItem[]>(() => [newBulkItem()])
  const [dropboxUrlError, setDropboxUrlError] = useState<string | null>(null)

  // Batch file upload state
  const [batchFiles, setBatchFiles]     = useState<BatchItem[]>([])
  const [batchStarted, setBatchStarted] = useState(false)

  // Shared metadata
  const [videoType, setVideoType]       = useState<VideoType>(initialType)
  const [title, setTitle]               = useState("")
  const [description, setDescription]   = useState("")
  const [categories, setCategories]     = useState<string[]>([])
  const [tags, setTags]                 = useState<string[]>([])
  const [tagSearch, setTagSearch]       = useState("")
  const [isPublic, setIsPublic]         = useState(true)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [riveUrl, setRiveUrl]           = useState("")

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
  const bulkDebounce   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

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

  // Fetch oEmbed metadata for a single bulk item
  async function fetchBulkMeta(id: string, url: string) {
    try { new URL(url) } catch { return }
    const provider = detectProvider(url)
    setBulkItems((prev) => prev.map((item) => item.id === id ? { ...item, provider, status: "loading" } : item))

    // Unsupported source — reject immediately with a clear message
    if (provider === "other") {
      setBulkItems((prev) => prev.map((item) =>
        item.id === id
          ? { ...item, provider, status: "error", errorMessage: "This platform doesn't support external embedding. Import from YouTube, Vimeo, Framerate, or Dropbox." }
          : item
      ))
      return
    }

    // Dropbox: validate and convert URL, no oembed needed
    if (provider === "dropbox") {
      const { rawUrl, error } = getDropboxRawUrl(url)
      if (error) {
        setBulkItems((prev) => prev.map((item) => item.id === id ? { ...item, provider, status: "error" } : item))
        setDropboxUrlError(error)
        return
      }
      // Check file size via HEAD request before accepting
      try {
        const head = await fetch(rawUrl!, { method: "HEAD" })
        const bytes = parseInt(head.headers.get("content-length") ?? "0", 10)
        if (bytes > 0 && bytes > 50 * 1024 * 1024) {
          setBulkItems((prev) => prev.map((item) => item.id === id ? { ...item, provider, status: "error" } : item))
          setDropboxUrlError(`File is ${Math.round(bytes / 1024 / 1024)} MB — over the 50 MB limit. Compress to H.264 before importing.`)
          return
        }
      } catch {
        // CORS or network issue — let it through, size check is best-effort
      }
      const filename = (() => {
        try { return new URL(url).pathname.split("/").pop()?.replace(/\.mp4$/i, "") ?? "" } catch { return "" }
      })()
      setBulkItems((prev) => prev.map((item) =>
        item.id === id ? { ...item, url: rawUrl!, provider, status: "ready", title: item.title || filename } : item
      ))
      setDropboxUrlError(null)
      return
    }

    try {
      const res  = await fetch(`/api/videos/oembed?url=${encodeURIComponent(url)}`)
      const data = await res.json() as { title?: string | null; thumbnailUrl?: string | null; description?: string | null }
      setBulkItems((prev) => prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title:        item.title       || data.title       || "",
              description:  item.description || data.description || "",
              thumbnailUrl: data.thumbnailUrl ?? (provider === "youtube" ? getVideoThumbnail(url) : null),
              status:       "ready",
            }
          : item
      ))
    } catch {
      const thumb = provider === "youtube" ? getVideoThumbnail(url) : null
      setBulkItems((prev) => prev.map((item) =>
        item.id === id ? { ...item, thumbnailUrl: thumb, status: thumb ? "ready" : "error" } : item
      ))
    }
  }

  function handleBulkUrlChange(id: string, url: string) {
    setBulkItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, url, provider: null, thumbnailUrl: null, status: "idle" } : item
    ))
    setDropboxUrlError(null)
    const existing = bulkDebounce.current.get(id)
    if (existing) clearTimeout(existing)
    if (!url.trim()) return
    const timer = setTimeout(() => fetchBulkMeta(id, url), 400)
    bulkDebounce.current.set(id, timer)
  }

  function updateBulkTitle(id: string, title: string) {
    setBulkItems((prev) => prev.map((item) => item.id === id ? { ...item, title } : item))
  }

  function addBulkItem() {
    setBulkItems((prev) => prev.length < 10 ? [...prev, newBulkItem()] : prev)
  }

  function removeBulkItem(id: string) {
    setBulkItems((prev) => prev.length > 1 ? prev.filter((item) => item.id !== id) : prev)
  }

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
    setDropboxUrlError(null)
    if (next === "import") {
      setBulkItems([newBulkItem()])
    }
    // Reset shared fields so users start fresh
    setTitle("")
    setDescription("")
    setCategories([])
    setTags([])
    setTagSearch("")
    setThumbnail(null)
    setSelectedFrame(null)
    setTab("basics")
  }

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat)
        : prev.length < MAX_CATEGORIES ? [...prev, cat] : prev
    )
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag)
        : prev.length < MAX_TAGS ? [...prev, tag] : prev
    )
  }

  function filesToBatch(files: File[]): BatchItem[] {
    return files
      .filter((f) => ACCEPTED_VIDEO_TYPES.includes(f.type))
      .slice(0, MAX_BATCH)
      .map((f) => ({
        id:       crypto.randomUUID(),
        file:     f,
        title:    f.name.replace(/\.(mp4|mov|avi)$/i, "").replace(/[-_]+/g, " ").trim(),
        status:   "pending" as const,
        progress: 0,
      }))
  }

  function updateBatchItem(id: string, patch: Partial<BatchItem>) {
    setBatchFiles((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i))
  }

  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) setFile(f)
    }
  }

  function handleVideoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) setFile(f)
    }
  }

  async function handleBatchUpload() {
    if (batchStarted) return
    setBatchStarted(true)
    setUploading(true)
    setUploadError(null)

    const results = await Promise.all(batchFiles.map(async (item) => {
      try {
        updateBatchItem(item.id, { status: "uploading" })

        let uid = ""
        let paywalled = false

        await new Promise<void>((resolve, reject) => {
          const upload = new TusUpload(item.file, {
            endpoint: "/api/videos/upload-url",
            chunkSize: 150 * 1024 * 1024,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: {
              filename:           item.file.name,
              filetype:           item.file.type,
              maxDurationSeconds: "600",
              requireSignedURLs:  "false",
              allowedOrigins:     "frendr.co,www.frendr.co",
            },
            onAfterResponse: (_req, res) => {
              const mediaId = res.getHeader("stream-media-id")
              if (mediaId) uid = mediaId
            },
            onError: (err) => {
              const status = (err as { originalResponse?: { getStatus: () => number } }).originalResponse?.getStatus()
              if (status === 402) paywalled = true
              reject(err)
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              updateBatchItem(item.id, { progress: Math.round((bytesUploaded / bytesTotal) * 100) })
            },
            onSuccess: () => resolve(),
          })
          upload.start()
        })

        if (paywalled) { setShowPaywall(true); setUploading(false); setBatchStarted(false); return null }

        updateBatchItem(item.id, { status: "saving", progress: 100 })
        const saveRes = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamId:     uid,
            title:        item.title.trim() || item.file.name,
            categories,
            tags,
            isPublic,
            allowDownloads,
            isAiGenerated,
            videoType,
          }),
        })
        if (!saveRes.ok) throw new Error("Could not save video")
        updateBatchItem(item.id, { status: "done" })
        return "done"
      } catch (err) {
        updateBatchItem(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" })
        return "error"
      }
    }))

    setUploading(false)
    if (results.every((r) => r === "done")) {
      router.push(`/${username}`)
    }
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
      let uid = ""

      await new Promise<void>((resolve, reject) => {
        const upload = new TusUpload(file, {
          endpoint: "/api/videos/upload-url",
          chunkSize: 150 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: {
            filename:           file.name,
            filetype:           file.type,
            maxDurationSeconds: "600",
            requireSignedURLs:  "false",
            allowedOrigins:     "frendr.co,www.frendr.co",
          },
          onAfterResponse: (_req, res) => {
            const mediaId = res.getHeader("stream-media-id")
            if (mediaId) uid = mediaId
          },
          onError: (err) => {
            const status = (err as { originalResponse?: { getStatus: () => number } }).originalResponse?.getStatus()
            if (status === 402) { setShowPaywall(true); setUploading(false) }
            reject(err)
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          },
          onSuccess: () => resolve(),
        })
        upload.start()
      })

      if (!uid) throw new Error("Could not get video ID")

      const effectiveThumbnail = videoType === "RECESS" && !thumbnail && videoFrames.length > 0
        ? videoFrames[0]
        : thumbnail
      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId:      uid,
          title:         title.trim(),
          description:   description || null,
          categories,
          tags,
          isPublic,
          allowDownloads,
          isAiGenerated,
          videoType,
          thumbnailUrl:  effectiveThumbnail || null,
          collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
        }),
      })
      if (!saveRes.ok) throw new Error("Could not save video")
      const video = await saveRes.json() as { id: string; slug?: string | null }
      router.push(videoType === "RECESS" ? "/recess" : `/v/${video.slug ?? video.id}`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
      setProgress(0)
    }
  }

  async function handleBulkImport() {
    const ready = bulkItems.filter((i) => i.status === "ready" && i.title.trim())
    if (!ready.length) return
    setUploading(true); setUploadError(null)
    try {
      const res = await fetch("/api/videos/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: ready.map((i) => ({
            externalUrl:   i.url,
            title:         i.title.trim(),
            description:   i.description.trim() || null,
            thumbnailUrl:  i.thumbnailUrl,
            videoType,
            categories,
            tags,
            isPublic,
            isAiGenerated,
            embedAutoplay: autoplay,
            embedLoop:     loop,
            collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
          })),
        }),
      })
      if (!res.ok) throw new Error("Could not import videos")
      router.push(`/${username}`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
    }
  }

  async function handleDropboxImport() {
    const rawUrl = bulkItems[0]?.url
    if (!rawUrl || !title.trim() || !thumbnail) return
    setUploading(true); setUploadError(null)
    try {
      const res = await fetch("/api/videos/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            externalUrl:   rawUrl,
            title:         title.trim(),
            description:   description.trim(),
            thumbnailUrl:  thumbnail,
            categories,
            tags,
            videoType,
            collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
          }],
        }),
      })
      if (!res.ok) throw new Error("Could not import video")
      router.push(`/${username}`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
    }
  }

  async function handleRivePost() {
    if (!riveUrl.trim() || !title.trim()) return
    setUploading(true); setUploadError(null)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), riveUrls: [riveUrl.trim()], source: "rive_world", body: description.trim() }),
      })
      if (!res.ok) throw new Error("Could not post to Rive World")
      router.push("/rive")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
      setUploading(false)
    }
  }

  const field = "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  // ── Credits / categories / tags / toggles — shared between upload and import ──
  const sharedImportFields = (
    <>
      {/* Credits / Collaborators */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Credits</label>
        {collabs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {collabs.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.06] pl-1.5 pr-2.5 py-1 font-sans text-xs text-core-black self-start">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden ${c.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}>
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
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden ${r.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}>
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

      {/* Category — guided discovery */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Category</label>
          <span className="font-sans text-xs text-foreground/30">{categories.length}/{MAX_CATEGORIES}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TAGS.map((cat) => {
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
        <p className="font-sans text-xs text-foreground/30">Helps people find your work in discovery. Pick up to {MAX_CATEGORIES}.</p>
      </div>

      {/* Tags — free-form search tags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Tags <span className="text-foreground/30">(optional)</span></label>
          <span className="font-sans text-xs text-foreground/30">{tags.length}/{MAX_TAGS}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-core-black bg-core-black px-3 py-0.5 font-sans text-xs font-medium text-white">
                {t}
                <button type="button" onClick={() => toggleTag(t)} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 h-9">
            <Search size={13} className="shrink-0 text-foreground/30" />
            <input className="flex-1 bg-transparent font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
              placeholder="Search tags…" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {VIDEO_TAGS.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase())).map((t) => {
              const on    = tags.includes(t)
              const maxed = !on && tags.length >= MAX_TAGS
              return (
                <button key={t} type="button" onClick={() => toggleTag(t)} disabled={maxed}
                  className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                    on ? "border-core-black bg-core-black text-white"
                      : maxed ? "border-border text-foreground/25 cursor-not-allowed"
                      : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                  )}
                >{t}</button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Make public */}
      <Toggle on={isPublic} onToggle={() => setIsPublic((v) => !v)} label="Make it public"
        description="Your video will appear in the Discover feed and on your profile." />

      {/* AI content */}
      <Toggle on={isAiGenerated} onToggle={() => setIsAiGenerated((v) => !v)} label="AI Generated Content"
        description="Let viewers know if this video was created with the help of AI tools." />

      {/* Downloads — only meaningful for direct file uploads, not URL imports */}
      {mode === "upload" && (
        <Toggle on={allowDownloads} onToggle={() => setAllowDownloads((v) => !v)} label="Allow downloads"
          description="Viewers can download the original file." />
      )}
    </>
  )

  // ── Thumbnail picker (shared by Portfolio and Recess) ───────────
  const thumbnailSection = (
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
          {thumbMode === "upload" && (
            <>
              {thumbnail ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnail} alt="Thumbnail preview" className="max-h-64 w-full object-contain rounded-lg bg-black" />
                  <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-black/50 px-3 py-1.5 font-sans text-xs text-white backdrop-blur hover:bg-black/70 transition-colors">
                    <input ref={thumbInputRef} type="file" accept="image/*" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={handleThumbInput} />
                    <ImageIcon size={11} /> Replace
                  </label>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); setThumbDragging(true) }}
                  onDragLeave={() => setThumbDragging(false)}
                  onDrop={handleThumbDrop}
                  className={cn(
                    "relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
                    thumbDragging ? "border-spring-green bg-spring-green/5" : "border-border hover:border-foreground/25"
                  )}
                >
                  <input ref={thumbInputRef} type="file" accept="image/*" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={handleThumbInput} />
                  <ImageIcon size={20} className="text-foreground/25" />
                  <p className="font-sans text-xs text-foreground/40">Drop an image or click to browse</p>
                  <p className="font-sans text-[11px] text-foreground/25">JPG, PNG, WebP · any aspect ratio</p>
                </label>
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
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
  )

  // ── Shared metadata fields (used in both modes) ──────────────
  const metadataFields = (
    <>
      {/* Thumbnail */}
      {thumbnailSection}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Video Title</label>
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

      {sharedImportFields}

      {/* Playback */}
      <Toggle on={autoplay} onToggle={() => setAutoplay((v) => !v)} label="Autoplay"
        description="Video starts playing as soon as it loads." />
      <Toggle on={loop} onToggle={() => setLoop((v) => !v)} label="Loop"
        description="Replay automatically when the video ends." />
    </>
  )

  const recessMetadataFields = (
    <>
      {/* Thumbnail */}
      {thumbnailSection}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Title</label>
        <input className={field} placeholder="Name this experiment…" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">
            Description <span className="font-normal text-foreground/30">(optional)</span>
          </label>
          <span className="font-sans text-xs text-foreground/30">{description.length}/{DESC_MAX}</span>
        </div>
        <textarea
          rows={3}
          maxLength={DESC_MAX}
          placeholder="What were you exploring? Tools, ideas, process…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none rounded-xl border border-border bg-white px-3 py-2.5 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
        />
      </div>

      {/* Tools used */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Tools used</label>
          <span className="font-sans text-xs text-foreground/30">{categories.length}/{MAX_RECESS_TOOLS}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOOL_TAGS.map((tool) => {
            const on    = categories.includes(tool)
            const maxed = !on && categories.length >= MAX_RECESS_TOOLS
            return (
              <button key={tool} type="button" onClick={() => toggleCategory(tool)} disabled={maxed}
                className={cn("inline-flex h-8 items-center rounded-full border px-4 font-sans text-sm font-medium transition-colors",
                  on    ? "border-core-black bg-core-black text-white"
                    : maxed ? "border-border text-foreground/25 cursor-not-allowed"
                    : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                )}
              >{tool}</button>
            )
          })}
        </div>
      </div>

      {/* Playback */}
      <Toggle on={autoplay} onToggle={() => setAutoplay((v) => !v)} label="Autoplay"
        description="Video starts playing as soon as it loads." />
      <Toggle on={loop} onToggle={() => setLoop((v) => !v)} label="Loop"
        description="Replay automatically when the video ends." />

      {/* Make public */}
      <Toggle on={isPublic} onToggle={() => setIsPublic((v) => !v)} label="Make it public"
        description="Your video will appear in the Discover feed and on your profile." />

      {/* AI content */}
      <Toggle on={isAiGenerated} onToggle={() => setIsAiGenerated((v) => !v)} label="AI Generated Content"
        description="Let viewers know if this video was created with the help of AI tools." />

      {/* Downloads */}
      <Toggle on={allowDownloads} onToggle={() => setAllowDownloads((v) => !v)} label="Allow downloads"
        description="Viewers can download the original file." />
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
            {videoType === "INTERACTIVE"
              ? "Share to Rive World"
              : videoType === "RECESS"
              ? "Drop something into Recess"
              : mode === "upload" ? "Upload a new video" : "Import from another platform"}
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground/50">
            {videoType === "INTERACTIVE"
              ? "Share your Rive work with the community."
              : videoType === "RECESS"
              ? "Quick loops, tool tests, and explorations — no polish required."
              : mode === "upload"
              ? "Share your work with the frendr community."
              : "Bring your Vimeo, YouTube, Framerate, or Dropbox work to your Frendr profile."}
          </p>
        </div>

        {/* Upgraded success banner */}
        {justUpgraded && !showPaywall && (
          <div className="mb-6 rounded-xl bg-spring-green/20 border border-spring-green/30 px-4 py-3">
            <p className="font-sans font-medium text-sm text-core-black">You&apos;re now on Frendr Pro — upload as much as you like.</p>
          </div>
        )}

        {/* Upload limit usage bar (free users only) */}
        {!isPro && !showPaywall && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-sans text-xs text-foreground/50">
                {Math.floor(uploadedSeconds / 60)}m {uploadedSeconds % 60}s of {Math.floor(freeSeconds / 60)}m free used
              </p>
              <button type="button" onClick={startCheckout} className="font-sans text-xs text-core-black hover:underline">
                Upgrade for $8/mo
              </button>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-spring-green transition-all"
                style={{ width: `${Math.min(100, (uploadedSeconds / freeSeconds) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Paywall */}
        {showPaywall && (
          <div className="rounded-2xl border border-border bg-mist-grey p-8 text-center">
            <p className="font-sans font-bold text-lg text-core-black mb-1">You&apos;ve used your 20 free minutes</p>
            <p className="font-sans text-sm text-foreground/50 mb-6">
              Upgrade to Frendr Pro to keep uploading — unlimited storage for just $8/month.
            </p>
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90 disabled:opacity-60"
            >
              {checkoutLoading ? "Loading…" : "Upgrade for $8/month"}
            </button>
            <p className="mt-4 font-sans text-xs text-foreground/40">Cancel anytime. Import from Vimeo, YouTube, and Framerate is always free.</p>
          </div>
        )}

        {/* Type selector */}
        <div className={cn("mb-6 grid grid-cols-3 gap-2", showPaywall && "hidden")}>
          {([
            { value: "PORTFOLIO"   as VideoType, label: "Portfolio",   desc: "Finished work you're proud of." },
            { value: "RECESS"      as VideoType, label: "Recess",      desc: "Personal experiments, not client work." },
            { value: "INTERACTIVE" as VideoType, label: "Interactive", desc: "Share your Rive work. Let people play with it." },
          ]).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setVideoType(value); setCategories([]); setTags([]); setTagSearch(""); setRiveUrl("") }}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors",
                videoType === value
                  ? "border-core-black bg-foreground/[0.015]"
                  : "border-border hover:border-foreground/30"
              )}
            >
              <p className="font-sans font-medium text-sm text-core-black">{label}</p>
              <p className="font-sans text-xs text-foreground/40">{desc}</p>
            </button>
          ))}
        </div>

        {/* Source toggle — hidden for Interactive (always URL-based) */}
        {!showPaywall && videoType !== "INTERACTIVE" && (
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
        )}

        {/* ══ INTERACTIVE MODE ═════════════════════════════════ */}
        {!showPaywall && videoType === "INTERACTIVE" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground/50">Rive URL</label>
              <input
                className={field}
                placeholder="https://rive.app/community/…"
                value={riveUrl}
                onChange={(e) => setRiveUrl(e.target.value)}
              />
              <p className="font-sans text-[11px] text-foreground/30">Paste the share link from rive.app</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground/50">Title</label>
              <input
                className={field}
                placeholder="Give this a title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-foreground/50">
                Description <span className="font-normal text-foreground/30">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tell the community about this piece…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none rounded-xl border border-border bg-white px-3 py-2.5 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
            </div>
            {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
              <Link href={`/${username}`} className="inline-flex h-10 items-center px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleRivePost}
                disabled={!riveUrl.trim() || !title.trim() || uploading}
                className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {uploading ? "Posting…" : "Post to Rive World"}
              </button>
            </div>
          </div>
        )}

        {/* ══ UPLOAD MODE ══════════════════════════════════════ */}
        {!showPaywall && videoType !== "INTERACTIVE" && mode === "upload" && (
          <>
            {/* ── Batch queue (2+ files selected) ── */}
            {batchFiles.length > 0 && (
              <div className="flex flex-col gap-6">

                {!batchStarted && (
                  <button
                    type="button"
                    onClick={() => { setBatchFiles([]); setBatchStarted(false) }}
                    className="inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    <ArrowLeft size={13} /> Start over
                  </button>
                )}

                {/* Queue list */}
                <div className="flex flex-col gap-2">
                  {batchFiles.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-xl border border-border">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                          <Upload size={14} className="text-foreground/30" />
                        </div>
                        <input
                          className="min-w-0 flex-1 bg-transparent font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
                          value={item.title}
                          onChange={(e) => setBatchFiles((prev) => prev.map((i) => i.id === item.id ? { ...i, title: e.target.value } : i))}
                          placeholder="Video title…"
                          disabled={item.status !== "pending"}
                        />
                        <span className="shrink-0 font-sans text-xs text-foreground/30">
                          {(item.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        {item.status === "pending" && !batchStarted && (
                          <button
                            type="button"
                            onClick={() => setBatchFiles((prev) => prev.filter((i) => i.id !== item.id))}
                            className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                        {item.status === "uploading" && (
                          <span className="w-8 shrink-0 text-right font-sans text-xs tabular-nums text-foreground/40">
                            {item.progress}%
                          </span>
                        )}
                        {item.status === "saving" && (
                          <span className="shrink-0 font-sans text-xs text-foreground/40">Saving…</span>
                        )}
                        {item.status === "done" && (
                          <Check size={13} className="shrink-0 text-spring-green" />
                        )}
                        {item.status === "error" && (
                          <span className="shrink-0 font-sans text-xs text-red-500">Failed</span>
                        )}
                      </div>
                      {item.status === "uploading" && (
                        <div className="h-0.5 w-full bg-border">
                          <div className="h-full bg-spring-green transition-all duration-300" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                      {item.status === "saving" && (
                        <div className="h-0.5 w-full animate-pulse bg-spring-green/50" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Add more files */}
                {!batchStarted && batchFiles.length < MAX_BATCH && (
                  <label className="relative inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,.mp4,.mov,.avi"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                      onChange={(e) => {
                        const newItems = filesToBatch(Array.from(e.target.files ?? []))
                        if (newItems.length) setBatchFiles((prev) => [...prev, ...newItems].slice(0, MAX_BATCH))
                      }}
                    />
                    <Upload size={12} /> Add more files
                  </label>
                )}

                {/* Shared settings */}
                <div className="border-t border-border pt-5 flex flex-col gap-5">
                  <p className="font-sans text-xs font-medium text-foreground/50">Settings applied to all videos</p>
                  {sharedImportFields}
                  <Toggle on={autoplay} onToggle={() => setAutoplay((v) => !v)} label="Autoplay" description="Video starts playing as soon as it loads." />
                  <Toggle on={loop}     onToggle={() => setLoop((v) => !v)}     label="Loop"     description="Replay automatically when the video ends." />
                </div>

                {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

                <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                  {!batchStarted && (
                    <Link href={`/${username}`} className="inline-flex h-10 items-center px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                      Cancel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={batchStarted || batchFiles.length === 0}
                    className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    {batchStarted
                      ? (batchFiles.every((i) => i.status === "done" || i.status === "error") ? "Done" : "Uploading…")
                      : `Upload ${batchFiles.length} video${batchFiles.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}

            {/* ── Single-file forms (hidden when batch queue is active) ── */}
            {batchFiles.length === 0 && <>
            {/* ── Recess: flat form, no tabs ── */}
            {videoType === "RECESS" && (
              <div className="flex flex-col gap-6">
                <div>
                  {file || uploading ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleVideoDrop}
                      className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-border transition-all duration-150"
                    >
                      {uploading ? (
                        <div className="flex w-full flex-col items-center gap-4 px-8 text-center">
                          <p className="font-sans text-sm font-medium text-core-black">
                            {progress < 100 ? "Uploading…" : "Finalising with Cloudflare…"}
                          </p>
                          <div className="w-full max-w-xs">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="max-w-[180px] truncate font-sans text-xs text-foreground/50">{file?.name}</span>
                              <span className="font-sans text-xs text-foreground/50">{progress < 100 ? `${progress}%` : ""}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                              {progress === 0 || progress === 100 ? (
                                <div className="h-full w-full animate-pulse rounded-full bg-spring-green/50" />
                              ) : (
                                <div className="h-full rounded-full bg-spring-green transition-all duration-500" style={{ width: `${progress}%` }} />
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 px-8 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spring-green/15">
                            <Upload size={20} className="text-spring-green" />
                          </div>
                          <div>
                            <p className="font-sans font-medium text-sm text-core-black">{file!.name}</p>
                            <p className="font-sans text-xs text-foreground/40 mt-0.5">{(file!.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setThumbnail(null) }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                          >
                            <X size={11} /> Change file
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleVideoDrop}
                      className={cn(
                        "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all duration-150",
                        dragging ? "border-spring-green bg-spring-green/5 scale-[1.005] cursor-copy"
                                 : "border-dashed border-border bg-foreground/[0.015] hover:border-foreground/25 hover:bg-foreground/[0.03]"
                      )}
                    >
                      <input ref={fileInputRef} type="file" multiple accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,.mp4,.mov,.avi" onChange={handleVideoInput} className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                        <Upload size={20} className="text-foreground/35" />
                      </div>
                      <div className="text-center">
                        <p className="font-sans font-medium text-sm text-core-black">{dragging ? "Drop to upload" : "Drop your video here"}</p>
                        <p className="font-sans text-xs text-foreground/40 mt-0.5">or click to browse · upload up to 5 at once</p>
                      </div>
                    </label>
                  )}
                  <p className="mt-2 text-center font-sans text-[11px] text-foreground/30">MP4 or MOV · up to 1 GB</p>
                </div>

                {recessMetadataFields}
              </div>
            )}

            {/* ── Portfolio: full tabbed form ── */}
            {videoType === "PORTFOLIO" && (
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
                      {file || uploading ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={handleVideoDrop}
                          className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-border transition-all duration-150"
                        >
                          {uploading ? (
                            <div className="flex w-full flex-col items-center gap-4 px-8 text-center">
                              <p className="font-sans text-sm font-medium text-core-black">
                                {progress < 100 ? "Uploading…" : "Finalising with Cloudflare…"}
                              </p>
                              <div className="w-full max-w-xs">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="max-w-[180px] truncate font-sans text-xs text-foreground/50">{file?.name}</span>
                                  <span className="font-sans text-xs text-foreground/50">{progress < 100 ? `${progress}%` : ""}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                                  {progress === 0 || progress === 100 ? (
                                    <div className="h-full w-full animate-pulse rounded-full bg-spring-green/50" />
                                  ) : (
                                    <div className="h-full rounded-full bg-spring-green transition-all duration-500" style={{ width: `${progress}%` }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 px-8 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spring-green/15">
                                <Upload size={20} className="text-spring-green" />
                              </div>
                              <div>
                                <p className="font-sans font-medium text-sm text-core-black">{file!.name}</p>
                                <p className="font-sans text-xs text-foreground/40 mt-0.5">{(file!.size / 1024 / 1024).toFixed(1)} MB</p>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setThumbnail(null) }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                              >
                                <X size={11} /> Change file
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label
                          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={handleVideoDrop}
                          className={cn(
                            "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all duration-150",
                            dragging ? "border-spring-green bg-spring-green/5 scale-[1.005] cursor-copy"
                                     : "border-dashed border-border bg-foreground/[0.015] hover:border-foreground/25 hover:bg-foreground/[0.03]"
                          )}
                        >
                          <input ref={fileInputRef} type="file" multiple accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,.mp4,.mov,.avi" onChange={handleVideoInput} className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" />
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                            <Upload size={20} className="text-foreground/35" />
                          </div>
                          <div className="text-center">
                            <p className="font-sans font-medium text-sm text-core-black">{dragging ? "Drop to upload" : "Drop your video here"}</p>
                            <p className="font-sans text-xs text-foreground/40 mt-0.5">or click to browse · upload up to 5 at once</p>
                          </div>
                        </label>
                      )}
                      <p className="mt-2 text-center font-sans text-[11px] text-foreground/30">MP4 or MOV · up to 1 GB</p>
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
              </>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
              {uploadError && (
                <p className="mr-auto font-sans text-xs text-red-500">{uploadError}</p>
              )}
              <Link href={`/${username}`} className="inline-flex h-10 items-center px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || !title.trim() || uploading}
                className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {uploading ? (progress < 100 ? "Uploading…" : "Finalising…") : videoType === "RECESS" ? "Drop into Recess" : "Upload Video"}
              </button>
            </div>
            </>}
          </>
        )}

        {/* ══ IMPORT MODE ══════════════════════════════════════ */}
        {!showPaywall && videoType !== "INTERACTIVE" && mode === "import" && (() => {
          const isDropboxMode = bulkItems.length === 1 && bulkItems[0].provider === "dropbox"
          const dropboxItem   = bulkItems[0]

          // ── Dropbox expanded form ──────────────────────────────
          if (isDropboxMode) {
            const canSubmit = !!thumbnail && title.trim().length > 0 && !uploading
            return (
              <div className="flex flex-col gap-6">

                {/* URL input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-medium text-foreground/50">Dropbox URL</label>
                  <div className="relative flex items-center">
                    <Link2 size={14} className="absolute left-3 text-foreground/30 pointer-events-none" />
                    <input
                      className="h-10 w-full rounded-lg border border-border bg-foreground/[0.02] pl-9 pr-24 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                      placeholder="Paste a Dropbox share link…"
                      value={dropboxItem.url}
                      onChange={(e) => handleBulkUrlChange(dropboxItem.id, e.target.value)}
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                      {dropboxItem.status === "loading" && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-foreground/40" />
                      )}
                      {dropboxItem.status === "ready" && (
                        <span className="rounded-full bg-core-black px-2 py-0.5 font-sans text-[10px] font-medium text-white">Dropbox</span>
                      )}
                    </div>
                  </div>
                  {dropboxUrlError ? (
                    <p className="font-sans text-xs text-red-500">{dropboxUrlError}</p>
                  ) : (
                    <p className="font-sans text-[11px] text-foreground/40">MP4 files only. Recommended under 500 MB.</p>
                  )}
                </div>

                {/* Full metadata form — identical to regular upload */}
                {dropboxItem.status === "ready" && (
                  <>
                    {metadataFields}

                    {!thumbnail && (
                      <p className="font-sans text-xs text-foreground/40">A thumbnail is required for Dropbox imports.</p>
                    )}

                    {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

                    <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                      <Link href={`/${username}`} className="inline-flex h-10 items-center px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                        Cancel
                      </Link>
                      <button
                        type="button"
                        onClick={handleDropboxImport}
                        disabled={!canSubmit}
                        className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Importing…" : "Import from Dropbox"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          }

          // ── Standard bulk import (YouTube, Vimeo, Framerate) ──
          return (
            <div className="flex flex-col gap-4">

              <p className="font-sans text-xs text-foreground/50">
                Paste up to 10 links — titles and thumbnails will be fetched automatically.
              </p>

              {/* URL rows */}
              <div className="flex flex-col gap-3">
                {bulkItems.map((item, idx) => (
                  <div key={item.id} className="rounded-xl border border-border bg-white p-3 flex flex-col gap-2">

                    {/* URL input row */}
                    <div className="relative flex items-center">
                      <Link2 size={14} className="absolute left-3 text-foreground/30 pointer-events-none" />
                      <input
                        className="h-10 w-full rounded-lg border border-border bg-foreground/[0.02] pl-9 pr-28 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                        placeholder="Paste a YouTube, Vimeo, Framerate, or Dropbox link…"
                        value={item.url}
                        onChange={(e) => handleBulkUrlChange(item.id, e.target.value)}
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        {item.status === "loading" && (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-foreground/40" />
                        )}
                        {item.provider && item.status !== "loading" && (
                          <span className="rounded-full bg-core-black px-2 py-0.5 font-sans text-[10px] font-medium text-white">
                            {getProviderLabel(item.provider)}
                          </span>
                        )}
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => removeBulkItem(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta row — shown once ready */}
                    {item.status === "ready" && (
                      <div className="flex items-center gap-2">
                        {item.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-[34px] w-[60px] shrink-0 rounded object-cover bg-foreground/5"
                          />
                        )}
                        <input
                          className="h-9 flex-1 rounded-lg border border-border bg-foreground/[0.02] px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
                          placeholder="Video title…"
                          value={item.title}
                          onChange={(e) => updateBulkTitle(item.id, e.target.value)}
                        />
                      </div>
                    )}

                    {item.status === "error" && (
                      <p className="font-sans text-xs text-red-500">
                        {item.errorMessage ?? "Could not load metadata — check the URL and try again."}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add row + ready count */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={addBulkItem}
                  disabled={bulkItems.length >= 10}
                  className="inline-flex items-center gap-1.5 font-sans text-sm text-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs leading-none">+</span>
                  Add another link
                </button>
                {(() => {
                  const n = bulkItems.filter((i) => i.status === "ready" && i.title.trim()).length
                  return n > 0 ? (
                    <span className="font-sans text-xs text-foreground/40">
                      {n} {n === 1 ? "video" : "videos"} ready to import
                    </span>
                  ) : null
                })()}
              </div>

              {/* Settings applied to all imported videos */}
              <div className="border-t border-border pt-5 flex flex-col gap-5">
                <p className="font-sans text-xs font-medium text-foreground/50">Settings applied to all imported videos</p>
                {sharedImportFields}
              </div>

              {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-5">
                <Link href={`/${username}`} className="inline-flex h-10 items-center px-6 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity">
                  Cancel
                </Link>
                {(() => {
                  const readyCount = bulkItems.filter((i) => i.status === "ready" && i.title.trim()).length
                  return (
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={readyCount === 0 || uploading}
                      className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Importing…" : `Import ${readyCount || ""} Video${readyCount !== 1 ? "s" : ""}`}
                    </button>
                  )
                })()}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
