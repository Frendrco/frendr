"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Image as ImageIcon, MoreHorizontal, Play, Search, Upload, X, AlertCircle } from "lucide-react"
import { Upload as TusUpload } from "tus-js-client"
import { detectProvider } from "@/lib/videoEmbed"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function randomFrameTimes(duration: number | null): string[] {
  if (!duration || duration <= 0) {
    // Fallback: fixed offsets in seconds that work for most videos
    return [2, 8, 15, 25, 40, 55].map(s => `${s}s`)
  }
  // Divide into 6 buckets across 5%–90% of the video, pick random point in each
  const lo = duration * 0.05
  const hi = duration * 0.90
  const bucketSize = (hi - lo) / 6
  return Array.from({ length: 6 }, (_, i) => {
    const bucketStart = lo + i * bucketSize
    const t = bucketStart + Math.random() * bucketSize
    return `${Math.round(t)}s`
  })
}

const field =
  "h-11 w-full rounded-xl border border-border bg-background px-4 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

const CATEGORIES = [
  "Motion Design", "Animation", "3D", "Motion Graphics", "VFX",
  "2D Animation", "3D Animation", "3D Type", "Typography",
  "Branding", "Commercial", "Music Video", "Short Film", "Film",
  "Loop", "Experimental", "Stop Motion", "Sound",
  "Blender", "Cinema 4D", "After Effects", "Cavalry", "Houdini",
  "Rive", "Nuke", "DaVinci Resolve", "TouchDesigner", "Toon Boom", "Animate", "Moho", "AI",
]
const MAX_CATEGORIES = 5
const RECESS_TOOLS = ["Blender", "Cinema 4D", "After Effects", "Cavalry", "Houdini", "Rive", "Nuke", "DaVinci Resolve", "TouchDesigner", "Toon Boom", "Animate", "Moho", "AI"]
const MAX_RECESS_TOOLS = 3

type EditTab = "basics" | "credits" | "embed"

interface CollabEntry {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: string | null
  status?: string // "PENDING" | "ACCEPTED" | "DECLINED"
}

interface Props {
  videoId: string
  username: string
  streamId: string | null
  streamDuration?: number | null
  videoType?: string
  initialTitle: string
  initialDescription: string
  initialTags: string[]
  initialCategories: string[]
  initialThumbnailUrl: string | null
  initialVisibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE"
  initialHasPassword: boolean
  initialHideFromFeeds: boolean
  initialAllowComments: boolean
  initialAllowDownloads: boolean
  initialCollaborators: CollabEntry[]
  initialEmbedAutoplay?: boolean
  initialEmbedLoop?: boolean
  initialEmbedShowControls?: boolean
  initialAllowEmbedding?: boolean
  initialExternalUrl?: string | null
  externalEditOpen?: boolean
  onExternalEditOpenChange?: (open: boolean) => void
}

export function VideoOwnerActions({
  videoId,
  username,
  streamId,
  streamDuration,
  videoType,
  initialTitle,
  initialDescription,
  initialTags,
  initialCategories,
  initialThumbnailUrl,
  initialVisibility,
  initialHasPassword,
  initialHideFromFeeds,
  initialAllowComments,
  initialAllowDownloads,
  initialCollaborators,
  initialEmbedAutoplay = false,
  initialEmbedLoop = false,
  initialEmbedShowControls = true,
  initialAllowEmbedding = true,
  initialExternalUrl = null,
  externalEditOpen,
  onExternalEditOpenChange,
}: Props) {
  const isRecess = videoType === "RECESS"
  const isExternalVideo = !streamId && !!initialExternalUrl
  const router = useRouter()

  const [editOpen,   setEditOpen]   = useState(false)
  const effectiveEditOpen    = externalEditOpen    ?? editOpen
  const setEffectiveEditOpen = onExternalEditOpenChange ?? setEditOpen
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [tab,        setTab]        = useState<EditTab>("basics")
  const [urlError,   setUrlError]   = useState<string | null>(null)

  // Basics tab state
  const [title,          setTitle]         = useState(initialTitle)
  const [description,    setDescription]   = useState(initialDescription)
  const [externalUrl,    setExternalUrl]   = useState(initialExternalUrl ?? "")
  const [tags,           setTags]          = useState<string[]>(initialTags)
  const [recessTools,    setRecessTools]   = useState<string[]>(initialCategories)
  const [categorySearch, setCategorySearch] = useState("")
  const [thumbnailUrl,   setThumbnailUrl]  = useState(initialThumbnailUrl ?? "")
  const [visibility,     setVisibility]    = useState<"PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE">(initialVisibility)
  const [newPassword,    setNewPassword]   = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [hideFromFeeds,  setHideFromFeeds] = useState(initialHideFromFeeds)
  const [allowComments,  setAllowComments] = useState(initialAllowComments)
  const [thumbMode,      setThumbMode]     = useState<"default" | "frames">("default")
  const [framePercents,  setFramePercents] = useState(() => randomFrameTimes(streamDuration ?? null))
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [selectedFrame,  setSelectedFrame] = useState<number | null>(null)

  // Replace-video state
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const pendingReplaceFile = useRef<File | null>(null)
  const replaceTusRef = useRef<TusUpload | null>(null)
  const [replaceUpload, setReplaceUpload] = useState<{ status: "idle" | "uploading" | "complete" | "error"; progress: number; uid: string | null; error: string | null }>({ status: "idle", progress: 0, uid: null, error: null })

  // Credits tab state
  const [collabs, setCollabs]             = useState<CollabEntry[]>(initialCollaborators)
  const [collabSearch, setCollabSearch]   = useState("")
  const [collabResults, setCollabResults] = useState<Omit<CollabEntry, "role">[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const collabDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Embed tab state
  const [allowEmbedding, setAllowEmbedding] = useState(initialAllowEmbedding)
  const [allowDownloads, setAllowDownloads] = useState(initialAllowDownloads)
  const [embedAutoplay,  setEmbedAutoplay]  = useState(initialEmbedAutoplay)
  const [embedLoop,      setEmbedLoop]      = useState(initialEmbedLoop)
  const [showControls,   setShowControls]   = useState(initialEmbedShowControls)
  const [copied,         setCopied]         = useState(false)

  // Re-sync state when modal opens
  useEffect(() => {
    if (effectiveEditOpen) {
      setCollabs(initialCollaborators)
      setNewPassword("")
      setRemovePassword(false)
      cancelReplaceUpload()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEditOpen])

  const searchCollabs = useCallback((q: string) => {
    if (!q.trim()) { setCollabResults([]); return }
    setCollabLoading(true)
    fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { id: string; username: string; displayName: string; avatarUrl: string | null }[]) =>
        setCollabResults(data.map((u) => ({ userId: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl })))
      )
      .catch(() => setCollabResults([]))
      .finally(() => setCollabLoading(false))
  }, [])

  useEffect(() => {
    if (collabDebounce.current) clearTimeout(collabDebounce.current)
    collabDebounce.current = setTimeout(() => searchCollabs(collabSearch), 150)
    return () => { if (collabDebounce.current) clearTimeout(collabDebounce.current) }
  }, [collabSearch, searchCollabs])

  function addCollab(user: Omit<CollabEntry, "role" | "status">) {
    if (!collabs.find((c) => c.userId === user.userId))
      setCollabs((prev) => [...prev, { ...user, role: "", status: "PENDING" }])
    setCollabSearch("")
    setCollabResults([])
  }

  function removeCollab(userId: string) {
    setCollabs((prev) => prev.filter((c) => c.userId !== userId))
  }

  function updateCollabRole(userId: string, role: string) {
    setCollabs((prev) => prev.map((c) => c.userId === userId ? { ...c, role } : c))
  }

  async function handleThumbFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const input = e.target
    if (!file) return
    setUploadingThumb(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/videos/upload-thumbnail", { method: "POST", body: form })
    const data = await res.json() as { thumbnailUrl?: string }
    if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl)
    setUploadingThumb(false)
    input.value = ""
  }

  function pickFrame(i: number) {
    if (!streamId) return
    setThumbnailUrl(
      `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=${framePercents[i]}&width=1280`
    )
    setSelectedFrame(i)
    setThumbMode("default")
  }

  function onReplaceFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    pendingReplaceFile.current = file
    setReplaceConfirmOpen(true)
  }

  function cancelReplaceUpload() {
    if (replaceTusRef.current) {
      try { replaceTusRef.current.abort() } catch { /* ignore */ }
      replaceTusRef.current = null
    }
    setReplaceUpload({ status: "idle", progress: 0, uid: null, error: null })
  }

  async function startReplaceUpload(f: File) {
    cancelReplaceUpload()
    setReplaceUpload({ status: "uploading", progress: 0, uid: null, error: null })

    let uploadUrl = ""
    let uid = ""
    try {
      const res = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileSize: f.size, name: title.trim() || f.name, filename: f.name, filetype: f.type }),
      })
      if (res.status === 402) { setReplaceUpload({ status: "error", progress: 0, uid: null, error: "You've reached your upload limit." }); return }
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      uploadUrl = data.uploadUrl
      uid = data.uid
    } catch {
      setReplaceUpload({ status: "error", progress: 0, uid: null, error: "Upload failed — check your connection and try again." })
      return
    }

    const upload = new TusUpload(f, {
      uploadUrl,
      chunkSize: 150 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      onError: () => {
        setReplaceUpload({ status: "error", progress: 0, uid: null, error: "Upload failed — check your connection and try again." })
        replaceTusRef.current = null
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setReplaceUpload((prev) => ({ ...prev, progress: Math.round((bytesUploaded / bytesTotal) * 100) }))
      },
      onSuccess: () => {
        setReplaceUpload({ status: "complete", progress: 100, uid, error: null })
        replaceTusRef.current = null
      },
    })
    replaceTusRef.current = upload
    upload.start()
  }

  function confirmReplace() {
    setReplaceConfirmOpen(false)
    const f = pendingReplaceFile.current
    pendingReplaceFile.current = null
    if (f) startReplaceUpload(f)
  }

  async function handleSave() {
    if (replaceUpload.status === "uploading") return
    if (isExternalVideo && externalUrl.trim()) {
      const provider = detectProvider(externalUrl.trim())
      if (provider === "other") {
        setUrlError("Unsupported URL. Please use a YouTube, Vimeo, Framerate, or Dropbox link.")
        return
      }
    }
    setUrlError(null)
    setSaving(true)
    const res = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:             title.trim(),
        description:       description.trim() || null,
        tags,
        ...(isRecess && { categories: recessTools }),
        ...(replaceUpload.status === "complete" && replaceUpload.uid && { streamId: replaceUpload.uid }),
        thumbnailUrl:      thumbnailUrl.trim() || null,
        ...(isExternalVideo && { externalUrl: externalUrl.trim() || null }),
        visibility,
        ...(newPassword.trim() && { password: newPassword.trim() }),
        ...(removePassword && { password: null }),
        hideFromFeeds,
        allowComments,
        allowDownloads:    streamId ? allowDownloads : undefined,
        collaborators:     collabs.map((c) => ({ userId: c.userId, role: (c.role ?? "").trim() || null })),
        allowEmbedding,
        embedAutoplay,
        embedLoop,
        embedShowControls: showControls,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setUrlError(data.error ?? "Something went wrong. Please try again.")
      return
    }
    setEffectiveEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
    router.push(`/${username}`)
  }

  const embedParams = new URLSearchParams()
  if (embedAutoplay) { embedParams.set("autoplay", "true"); embedParams.set("muted", "true") }
  if (embedLoop)      embedParams.set("loop", "true")
  if (!showControls)  embedParams.set("controls", "false")
  // Carry the Frendr cover into Cloudflare's player (URLSearchParams encodes the value).
  if (thumbnailUrl.trim()) embedParams.set("poster", thumbnailUrl.trim())
  const embedParamStr = embedParams.toString()
  const embedSrc = streamId
    ? `https://iframe.videodelivery.net/${streamId}${embedParamStr ? `?${embedParamStr}` : ""}`
    : `https://frendr.com/embed/${videoId}`

  function copyEmbed() {
    navigator.clipboard.writeText(
      `<iframe src="${embedSrc}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const currentThumb = thumbnailUrl.trim() || null

  return (
    <>
      {/* ── Three-dot trigger — opens modal directly ──────────── */}
      <button
        type="button"
        aria-label="Edit video"
        onClick={() => { setThumbMode("default"); setSelectedFrame(null); setTab("basics"); setEditOpen(true) }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <MoreHorizontal size={15} />
      </button>

      {/* ── Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={effectiveEditOpen} onOpenChange={setEffectiveEditOpen}>
        <DialogContent
          className="sm:max-w-lg md:max-w-2xl p-0 gap-0 max-h-[90dvh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          {/* Pinned header */}
          <div className="shrink-0 border-b border-border">
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
              <DialogTitle className="font-sans text-base font-semibold text-foreground">
                Edit video
              </DialogTitle>
              <DialogClose
                render={
                  <button
                    aria-label="Close"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:bg-accent hover:text-foreground transition-colors"
                  />
                }
              >
                <X size={16} />
              </DialogClose>
            </div>
            {/* Tab strip */}
            <div className="flex gap-6 px-4">
              {(["basics", "credits", "embed"] as EditTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "pb-2.5 pt-2 font-sans font-medium text-sm capitalize border-b-2 -mb-px transition-colors",
                    tab === t
                      ? "border-foreground text-foreground"
                      : "border-transparent text-foreground/40 hover:text-foreground/70"
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">

            {/* ── Basics tab ── */}
            {tab === "basics" && (
              <div className="flex flex-col gap-5">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-foreground">Title</label>
                  <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* External URL — only for URL-imported videos */}
                {isExternalVideo && (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-sm font-medium text-foreground">Video URL</label>
                    <input
                      className={field}
                      type="url"
                      value={externalUrl}
                      onChange={(e) => { setExternalUrl(e.target.value); setUrlError(null) }}
                      placeholder="https://vimeo.com/… or https://youtu.be/…"
                    />
                    {urlError ? (
                      <p className="flex items-center gap-1.5 font-sans text-xs text-destructive">
                        <AlertCircle size={12} className="shrink-0" />
                        {urlError}
                      </p>
                    ) : (
                      <p className="font-sans text-xs text-foreground/40">Supported: YouTube, Vimeo, Framerate, Dropbox</p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-foreground">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green resize-none"
                    rows={4}
                    placeholder="Add a description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Tags / Tools */}
                {isRecess ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <label className="font-sans text-sm font-medium text-foreground">Tools used</label>
                      <span className="font-sans text-xs text-foreground/40">{recessTools.length}/{MAX_RECESS_TOOLS}</span>
                    </div>
                    {recessTools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {recessTools.map((tool) => (
                          <span key={tool} className="inline-flex items-center gap-1 rounded-full border border-core-black bg-core-black dark:bg-white dark:border-white px-3 py-0.5 font-sans text-xs font-medium text-white dark:text-core-black">
                            {tool}
                            <button type="button" onClick={() => setRecessTools((prev) => prev.filter((t) => t !== tool))} className="hover:opacity-60 transition-opacity">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {RECESS_TOOLS.filter((t) => !recessTools.includes(t)).map((tool) => {
                        const maxed = recessTools.length >= MAX_RECESS_TOOLS
                        return (
                          <button key={tool} type="button"
                            onClick={() => !maxed && setRecessTools((prev) => [...prev, tool])}
                            disabled={maxed}
                            className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                              maxed ? "border-border text-foreground/25 cursor-not-allowed"
                                    : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                            )}
                          >{tool}</button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <label className="font-sans text-sm font-medium text-foreground">Categories</label>
                      <span className="font-sans text-xs text-foreground/40">{tags.length}/{MAX_CATEGORIES}</span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((cat) => (
                          <span key={cat} className="inline-flex items-center gap-1 rounded-full border border-core-black bg-core-black dark:bg-white dark:border-white px-3 py-0.5 font-sans text-xs font-medium text-white dark:text-core-black">
                            {cat}
                            <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== cat))} className="hover:opacity-60 transition-opacity">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
                      <div className="flex items-center gap-2 rounded-lg border border-border px-3 h-9">
                        <Search size={13} className="shrink-0 text-foreground/30" />
                        <input className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                          placeholder="Search categories…" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {CATEGORIES.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
                          const on    = tags.includes(cat)
                          const maxed = !on && tags.length >= MAX_CATEGORIES
                          return (
                            <button key={cat} type="button"
                              onClick={() => setTags((prev) => on ? prev.filter((t) => t !== cat) : maxed ? prev : [...prev, cat])}
                              disabled={maxed}
                              className={cn("inline-flex h-7 items-center rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                                on    ? "border-core-black bg-core-black dark:bg-white dark:border-white text-white dark:text-core-black"
                                  : maxed ? "border-border text-foreground/25 cursor-not-allowed"
                                  : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                              )}
                            >{cat}</button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-medium text-foreground">Thumbnail</label>

                  {thumbMode === "default" ? (
                    <div className="flex gap-3">
                      <div className="h-[88px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-border bg-mist-grey flex items-center justify-center">
                        {currentThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={currentThumb} alt="Thumbnail" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={22} className="text-foreground/20" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <label className={cn("relative flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-border px-4 font-sans text-sm text-foreground transition-colors hover:border-foreground/30", uploadingThumb && "opacity-50 pointer-events-none")}>
                          <Upload size={14} className="shrink-0" />
                          {uploadingThumb ? "Uploading…" : "Upload image"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10" onChange={handleThumbFileChange} disabled={uploadingThumb} />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setFramePercents(randomFrameTimes(streamDuration ?? null)); setThumbMode("frames") }}
                          disabled={!streamId}
                          className="flex h-10 w-full items-center gap-2 rounded-xl border border-border px-4 font-sans text-sm text-foreground transition-colors hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Play size={14} className="shrink-0" />
                          Pick a frame
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {framePercents.map((pct, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => pickFrame(i)}
                            className={cn(
                              "relative overflow-hidden rounded-lg border-2 transition-colors bg-mist-grey aspect-video",
                              selectedFrame === i ? "border-core-black" : "border-transparent hover:border-foreground/30"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=${pct}&width=640`}
                              alt={`Frame at ${pct}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setThumbMode("default")}
                        className="font-sans text-xs text-foreground/40 hover:text-foreground/60 text-left transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  )}
                </div>

                {/* Replace video */}
                {streamId && (
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-sm font-medium text-foreground">Replace video</label>

                    {replaceUpload.status === "complete" ? (
                      <div className="flex items-center gap-3 rounded-xl border border-spring-green bg-spring-green/10 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-spring-green/20">
                          <Check size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-sans text-sm font-medium text-foreground">New video ready</p>
                          <p className="font-sans text-xs text-foreground/50">Save changes to apply. This replaces the current file.</p>
                        </div>
                        <button type="button" onClick={cancelReplaceUpload} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">
                          Undo
                        </button>
                      </div>
                    ) : replaceUpload.status === "uploading" ? (
                      <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="font-sans text-sm font-medium text-foreground">Uploading new file…</p>
                          <span className="font-sans text-xs text-foreground/50">{replaceUpload.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-spring-green transition-all" style={{ width: `${replaceUpload.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left transition-colors hover:border-foreground/30">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-mist-grey">
                          <Upload size={15} className="text-foreground/40" />
                        </div>
                        <div>
                          <p className="font-sans text-sm font-medium text-foreground">Upload a new file</p>
                          <p className="font-sans text-xs text-foreground/40">Replaces the video, keeps all metadata and tags</p>
                        </div>
                        <input type="file" accept="video/*" className="hidden" onChange={onReplaceFilePick} />
                      </label>
                    )}

                    {replaceUpload.status === "error" && (
                      <p className="flex items-center gap-1.5 font-sans text-xs text-destructive">
                        <AlertCircle size={12} className="shrink-0" />
                        {replaceUpload.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Visibility */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-foreground">Visibility</label>
                  <div className="relative">
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE")}
                      className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-4 pr-10 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-spring-green"
                    >
                      <option value="PUBLIC">Everyone</option>
                      <option value="FOLLOWERS_ONLY">Followers only</option>
                      <option value="PRIVATE">Only me</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40"
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Password protection */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-foreground">Password protection</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={initialHasPassword ? "Enter new password to change" : "Set a password (optional)"}
                    value={removePassword ? "" : newPassword}
                    disabled={removePassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={field}
                  />
                  {initialHasPassword && !removePassword && (
                    <button
                      type="button"
                      onClick={() => { setRemovePassword(true); setNewPassword("") }}
                      className="font-sans text-xs text-destructive hover:text-destructive/70 transition-colors text-left"
                    >
                      Remove password
                    </button>
                  )}
                  {removePassword && (
                    <button
                      type="button"
                      onClick={() => setRemovePassword(false)}
                      className="font-sans text-xs text-foreground/40 hover:text-foreground/60 transition-colors text-left"
                    >
                      Keep existing password
                    </button>
                  )}
                  <p className="font-sans text-xs text-foreground/30">Anyone with the link will need this password to watch.</p>
                </div>

                {/* Hide from feeds / Allow comments */}
                {[
                  { on: hideFromFeeds,  set: setHideFromFeeds,  label: "Hide from Discover feed", desc: "Your video won't appear in feeds but can still be shared via link." },
                  { on: !allowComments, set: (v: boolean) => setAllowComments(!v), label: "Disable comments", desc: "Viewers won't be able to leave comments on this video." },
                ].map(({ on, set, label, desc }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set(!on)}
                    className="flex items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">{label}</p>
                      <p className="font-sans text-xs text-foreground/40">{desc}</p>
                    </div>
                    <div className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-spring-green" : "bg-border")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
                    </div>
                  </button>
                ))}

                {/* Allow downloads */}
                {streamId && (
                  <button
                    type="button"
                    onClick={() => setAllowDownloads((v) => !v)}
                    className="flex items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">Allow downloads</p>
                      <p className="font-sans text-xs text-foreground/40">Let viewers download your video as an MP4 file.</p>
                    </div>
                    <div className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", allowDownloads ? "bg-spring-green" : "bg-border")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform", allowDownloads ? "translate-x-4" : "translate-x-0.5")} />
                    </div>
                  </button>
                )}

                {/* Player options */}
                <div className="flex flex-col gap-5">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Player options</p>
                  {([
                    { on: embedAutoplay, set: setEmbedAutoplay, label: "Autoplay",             desc: "Video starts playing as soon as it loads." },
                    { on: embedLoop,     set: setEmbedLoop,     label: "Loop",                 desc: "Replay automatically when the video ends." },
                    { on: showControls,  set: setShowControls,  label: "Show player controls", desc: "Display play, pause, and volume controls to viewers." },
                  ] as const).map(({ on, set, label, desc }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set((v) => !v)}
                      className="flex items-center justify-between gap-4 text-left"
                    >
                      <div>
                        <p className="font-sans text-sm font-medium text-foreground">{label}</p>
                        <p className="font-sans text-xs text-foreground/40">{desc}</p>
                      </div>
                      <div className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-spring-green" : "bg-border")}>
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Embed tab ── */}
            {tab === "embed" && (
              <div className="flex flex-col gap-8">
                {/* Allow embedding toggle */}
                <div className="rounded-xl border border-border p-5">
                  <button
                    type="button"
                    onClick={() => setAllowEmbedding((v) => !v)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">Allow embedding on other sites</p>
                      <p className="font-sans text-xs text-foreground/40">Let anyone embed your video player on their website or blog.</p>
                    </div>
                    <div className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", allowEmbedding ? "bg-spring-green" : "bg-border")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform", allowEmbedding ? "translate-x-4" : "translate-x-0.5")} />
                    </div>
                  </button>
                </div>

                {/* Embed code */}
                <div className={cn("flex flex-col gap-2 transition-opacity duration-200", !allowEmbedding && "pointer-events-none opacity-30")}>
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Embed code</p>
                  <div className="relative">
                    <pre className="w-full overflow-x-auto rounded-xl border border-border bg-foreground/[0.02] px-4 py-4 font-mono text-xs text-foreground/50 leading-relaxed whitespace-pre">{`<iframe\n  src="${embedSrc}"\n  width="640" height="360"\n  frameborder="0"\n  allowfullscreen\n></iframe>`}</pre>
                    <button
                      type="button"
                      onClick={copyEmbed}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      {copied ? <Check size={12} className="text-spring-green" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="font-sans text-xs text-foreground/30">The embed code becomes active once your video is published.</p>
                </div>
              </div>
            )}

            {/* ── Credits tab ── */}
            {tab === "credits" && (
              <div className="flex flex-col gap-4">
                <p className="font-sans text-xs text-foreground/40">
                  Credit collaborators who worked on this video. Add a role like "Director" or "Sound Design" for each person.
                </p>

                {/* Existing credits */}
                {collabs.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {collabs.map((c) => (
                      <span
                        key={c.userId}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border pl-1.5 pr-2.5 py-1 font-sans text-xs text-foreground self-start",
                          c.status === "DECLINED"
                            ? "border-destructive/30 bg-destructive/5 opacity-60"
                            : "border-border bg-foreground/[0.06]"
                        )}
                      >
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
                          value={c.role ?? ""}
                          onChange={(e) => updateCollabRole(c.userId, e.target.value)}
                          placeholder="Role…"
                          className="w-20 bg-transparent placeholder:text-foreground/35 text-foreground focus:outline-none"
                        />
                        {c.status === "PENDING" && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                        {c.status === "DECLINED" && (
                          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-sans text-[10px] font-medium text-destructive">
                            Declined
                          </span>
                        )}
                        <button type="button" onClick={() => removeCollab(c.userId)} className="text-foreground/40 hover:text-foreground transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 h-11">
                    <Search size={13} className="shrink-0 text-foreground/30" />
                    <input
                      className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                      placeholder="Search by name or @handle…"
                      value={collabSearch}
                      onChange={(e) => setCollabSearch(e.target.value)}
                    />
                    {collabLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-foreground/40 shrink-0" />}
                  </div>
                  {collabResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                      {collabResults
                        .filter((r) => !collabs.find((c) => c.userId === r.userId))
                        .map((r) => (
                          <button
                            key={r.userId}
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
                              <p className="font-sans text-sm font-medium text-foreground">{r.displayName}</p>
                              <p className="font-sans text-xs text-foreground/40">@{r.username}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Pinned footer */}
          <div className="shrink-0 flex items-center gap-2 border-t border-border bg-mist-grey/50 px-4 py-3 rounded-b-xl">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="font-sans text-sm text-destructive hover:text-destructive/70 transition-colors mr-auto"
            >
              Delete video
            </button>
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim() || replaceUpload.status === "uploading"}
              className="inline-flex h-10 items-center rounded-xl bg-spring-green px-5 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : replaceUpload.status === "uploading" ? "Video uploading…" : "Save changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ─────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-semibold text-foreground">
              Delete this video?
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-sm text-foreground/60">
            This can&apos;t be undone. The video will be permanently removed.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Replace confirm dialog ────────────────────────────── */}
      <Dialog open={replaceConfirmOpen} onOpenChange={(o) => { setReplaceConfirmOpen(o); if (!o) pendingReplaceFile.current = null }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-semibold text-foreground">
              Replace the video file?
            </DialogTitle>
          </DialogHeader>
          <p className="font-sans text-sm text-foreground/60">
            The current file will be permanently deleted when you save. Views, likes, comments, and the link stay the same.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={confirmReplace}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
