"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Image as ImageIcon, MoreHorizontal, Pencil, Play, Search, Upload, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const FRAME_PERCENTS = ["5%", "20%", "35%", "50%", "65%", "85%"]

const field =
  "h-11 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

type EditTab = "basics" | "credits" | "embed"

interface CollabEntry {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: string | null
}

interface Props {
  videoId: string
  username: string
  streamId: string | null
  initialTitle: string
  initialDescription: string
  initialTags: string[]
  initialThumbnailUrl: string | null
  initialIsPublic: boolean
  initialCollaborators: CollabEntry[]
}

export function VideoOwnerActions({
  videoId,
  username,
  streamId,
  initialTitle,
  initialDescription,
  initialTags,
  initialThumbnailUrl,
  initialIsPublic,
  initialCollaborators,
}: Props) {
  const router = useRouter()
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [tab,        setTab]        = useState<EditTab>("basics")

  // Basics tab state
  const [title,          setTitle]         = useState(initialTitle)
  const [description,    setDescription]   = useState(initialDescription)
  const [tags,           setTags]          = useState(initialTags.join(", "))
  const [thumbnailUrl,   setThumbnailUrl]  = useState(initialThumbnailUrl ?? "")
  const [isPublic,       setIsPublic]      = useState(initialIsPublic)
  const [thumbMode,      setThumbMode]     = useState<"default" | "frames">("default")
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [selectedFrame,  setSelectedFrame] = useState<number | null>(null)

  // Credits tab state
  const [collabs, setCollabs]             = useState<CollabEntry[]>(initialCollaborators)
  const [collabSearch, setCollabSearch]   = useState("")
  const [collabResults, setCollabResults] = useState<Omit<CollabEntry, "role">[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const collabDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Embed tab state
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedLink,  setCopiedLink]  = useState(false)

  // Re-sync credits when modal opens (in case initial data changed)
  useEffect(() => {
    if (editOpen) setCollabs(initialCollaborators)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen])

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

  function addCollab(user: Omit<CollabEntry, "role">) {
    if (!collabs.find((c) => c.userId === user.userId))
      setCollabs((prev) => [...prev, { ...user, role: "" }])
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
    if (!file) return
    setUploadingThumb(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/videos/upload-thumbnail", { method: "POST", body: form })
    const data = await res.json() as { thumbnailUrl?: string }
    if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl)
    setUploadingThumb(false)
    e.target.value = ""
  }

  function pickFrame(i: number) {
    if (!streamId) return
    const pct = encodeURIComponent(FRAME_PERCENTS[i])
    setThumbnailUrl(
      `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=${pct}`
    )
    setSelectedFrame(i)
    setThumbMode("default")
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:         title.trim(),
        description:   description.trim() || null,
        tags:          tags.split(",").map((t) => t.trim()).filter(Boolean),
        thumbnailUrl:  thumbnailUrl.trim() || null,
        isPublic,
        collaborators: collabs.map((c) => ({ userId: c.userId, role: (c.role ?? "").trim() || null })),
      }),
    })
    setSaving(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
    router.push(`/${username}`)
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const currentThumb = thumbnailUrl.trim() || null
  const embedCode = `<iframe\n  src="https://frendr.com/embed/${videoId}"\n  width="640" height="360"\n  frameborder="0"\n  allowfullscreen\n></iframe>`
  const directLink = `https://frendr.com/v/${videoId}`

  return (
    <>
      {/* ── Three-dot trigger ─────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More options"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setThumbMode("default"); setSelectedFrame(null); setTab("basics"); setEditOpen(true) }}>
            <Pencil size={14} />
            Edit video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="sm:max-w-lg p-0 gap-0 max-h-[90dvh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          {/* Pinned header */}
          <div className="shrink-0 border-b border-border">
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
              <DialogTitle className="font-sans text-base font-semibold text-core-black">
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
                      ? "border-core-black text-core-black"
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
                <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbFileChange} />

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-core-black">Title</label>
                  <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-core-black">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green resize-none"
                    rows={4}
                    placeholder="Add a description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-core-black">Tags</label>
                  <input
                    className={field}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="motion, 3d, loop"
                  />
                  <p className="font-sans text-xs text-foreground/40">Comma-separated</p>
                </div>

                {/* Thumbnail */}
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-medium text-core-black">Thumbnail</label>

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
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          disabled={uploadingThumb}
                          className="flex h-10 w-full items-center gap-2 rounded-xl border border-border px-4 font-sans text-sm text-core-black transition-colors hover:border-foreground/30 disabled:opacity-50"
                        >
                          <Upload size={14} className="shrink-0" />
                          {uploadingThumb ? "Uploading…" : "Upload image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbMode("frames")}
                          disabled={!streamId}
                          className="flex h-10 w-full items-center gap-2 rounded-xl border border-border px-4 font-sans text-sm text-core-black transition-colors hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Play size={14} className="shrink-0" />
                          Pick a frame
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-6 gap-1.5">
                        {FRAME_PERCENTS.map((pct, i) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => pickFrame(i)}
                            className={cn(
                              "relative overflow-hidden rounded-lg border-2 transition-colors bg-mist-grey aspect-video",
                              selectedFrame === i ? "border-core-black" : "border-transparent hover:border-foreground/30"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=${encodeURIComponent(pct)}`}
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
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-medium text-core-black">Replace video</label>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left opacity-50 cursor-not-allowed"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-mist-grey">
                      <Upload size={15} className="text-foreground/40" />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-core-black">Upload a new file</p>
                      <p className="font-sans text-xs text-foreground/40">Replaces the video, keeps all metadata and tags</p>
                    </div>
                  </button>
                </div>

                {/* Visibility */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-medium text-core-black">Visibility</label>
                  <div className="relative">
                    <select
                      value={isPublic ? "public" : "private"}
                      onChange={(e) => setIsPublic(e.target.value === "public")}
                      className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-4 pr-10 font-sans text-sm text-core-black focus:outline-none focus:ring-2 focus:ring-spring-green"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
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
                      <span key={c.userId} className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.06] pl-1.5 pr-2.5 py-1 font-sans text-xs text-core-black self-start">
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
                          className="w-20 bg-transparent placeholder:text-foreground/35 text-core-black focus:outline-none"
                        />
                        <button type="button" onClick={() => removeCollab(c.userId)} className="text-foreground/40 hover:text-foreground transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
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
                              <p className="font-sans text-sm font-medium text-core-black">{r.displayName}</p>
                              <p className="font-sans text-xs text-foreground/40">@{r.username}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Embed tab ── */}
            {tab === "embed" && (
              <div className="flex flex-col gap-6">
                {/* Embed code */}
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Embed code</p>
                  <div className="relative">
                    <pre className="w-full overflow-x-auto rounded-xl border border-border bg-foreground/[0.02] px-4 py-4 font-mono text-xs text-foreground/50 leading-relaxed whitespace-pre">
                      {embedCode}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyText(embedCode, setCopiedEmbed)}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      {copiedEmbed ? <Check size={12} className="text-spring-green" /> : <Copy size={12} />}
                      {copiedEmbed ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Direct link */}
                <div className="flex flex-col gap-2">
                  <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/50">Direct link</p>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-foreground/[0.02] px-4 py-3">
                    <span className="flex-1 font-mono text-xs text-foreground/50 truncate">{directLink}</span>
                    <button
                      type="button"
                      onClick={() => copyText(directLink, setCopiedLink)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors shrink-0"
                    >
                      {copiedLink ? <Check size={12} className="text-spring-green" /> : <Copy size={12} />}
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
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
              disabled={saving || !title.trim()}
              className="inline-flex h-10 items-center rounded-xl bg-spring-green px-5 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ─────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-semibold text-core-black">
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
    </>
  )
}
