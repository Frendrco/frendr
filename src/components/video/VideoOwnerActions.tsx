"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Image as ImageIcon, MoreHorizontal, Pencil, Play, Upload, X } from "lucide-react"
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

interface Props {
  videoId: string
  username: string
  streamId: string | null
  initialTitle: string
  initialDescription: string
  initialTags: string[]
  initialThumbnailUrl: string | null
  initialIsPublic: boolean
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
}: Props) {
  const router = useRouter()
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const [title,          setTitle]         = useState(initialTitle)
  const [description,    setDescription]   = useState(initialDescription)
  const [tags,           setTags]          = useState(initialTags.join(", "))
  const [thumbnailUrl,   setThumbnailUrl]  = useState(initialThumbnailUrl ?? "")
  const [isPublic,       setIsPublic]      = useState(initialIsPublic)
  const [thumbMode,      setThumbMode]     = useState<"default" | "frames">("default")
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [selectedFrame,  setSelectedFrame] = useState<number | null>(null)

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
    // reset input so the same file can be re-selected
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
        title:        title.trim(),
        description:  description.trim() || null,
        tags:         tags.split(",").map((t) => t.trim()).filter(Boolean),
        thumbnailUrl: thumbnailUrl.trim() || null,
        isPublic,
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

  const currentThumb = thumbnailUrl.trim() || null

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
          <DropdownMenuItem onClick={() => { setThumbMode("default"); setSelectedFrame(null); setEditOpen(true) }}>
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
          <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-border">
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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
          <div className="flex flex-col gap-5">

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-sm font-medium text-core-black">Title</label>
              <input
                className={field}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleThumbFileChange}
              />

              {thumbMode === "default" ? (
                <div className="flex gap-3">
                  {/* Preview */}
                  <div className="h-[88px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-border bg-mist-grey flex items-center justify-center">
                    {currentThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentThumb} alt="Thumbnail" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-foreground/20" />
                    )}
                  </div>

                  {/* Buttons */}
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
                /* Frame picker */
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-6 gap-1.5">
                    {FRAME_PERCENTS.map((pct, i) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => pickFrame(i)}
                        className={cn(
                          "relative overflow-hidden rounded-lg border-2 transition-colors bg-mist-grey aspect-video",
                          selectedFrame === i
                            ? "border-core-black"
                            : "border-transparent hover:border-foreground/30"
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
