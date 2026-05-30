"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Settings, Loader2, X, ImagePlus, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Props = {
  channel: {
    id: string
    name: string
    description: string | null
    coverUrl: string | null
    isPublic: boolean
  }
  canDelete: boolean
}

export function ChannelSettings({ channel, canDelete }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description ?? "")
  const [coverPreview, setCoverPreview] = useState<string | null>(channel.coverUrl)
  const [coverUrl, setCoverUrl] = useState<string | null>(channel.coverUrl)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  function handleOpen() {
    setName(channel.name)
    setDescription(channel.description ?? "")
    setCoverPreview(channel.coverUrl)
    setCoverUrl(channel.coverUrl)
    setCoverError("")
    setError("")
    setDeleteConfirm(false)
    setOpen(true)
  }

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverError("")
    setCoverPreview(URL.createObjectURL(file))
    setCoverUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/channels/upload-cover", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setCoverUrl(data.coverUrl)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setCoverPreview(channel.coverUrl)
    } finally {
      setCoverUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function clearCover() {
    setCoverPreview(null)
    setCoverUrl(null)
    setCoverError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          coverUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save")
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function deleteChannel() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/channels")
      router.refresh()
    } catch {
      setError("Failed to delete channel")
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border font-sans font-medium text-sm text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <Settings size={14} />
        Edit
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">

          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="font-sans font-semibold text-base text-core-black">
              Edit channel
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">Channel name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="h-9 rounded-lg border border-border bg-transparent px-3 font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Description <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={280}
                className="rounded-lg border border-border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs font-medium text-core-black">
                Cover image <span className="font-normal text-foreground/40">(optional)</span>
              </label>

              <input
                ref={fileInputRef}
                id="edit-cover-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleCoverSelect}
              />

              {coverPreview ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                  {coverUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                  {!coverUploading && (
                    <button
                      type="button"
                      onClick={clearCover}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="edit-cover-upload"
                  className="flex flex-col items-center justify-center gap-2 aspect-video w-full rounded-xl border border-dashed border-border hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  <ImagePlus size={20} className="text-foreground/30" />
                  <span className="font-sans text-xs text-foreground/40">Click to upload</span>
                  <span className="font-sans text-[10px] text-foreground/30">JPG, PNG or WebP</span>
                </label>
              )}

              {coverError && <p className="font-sans text-xs text-red-500">{coverError}</p>}
            </div>

            {/* Delete zone */}
            {canDelete && (
              <div className="mt-4 rounded-xl border border-red-200 p-4 flex flex-col gap-3">
                <div>
                  <p className="font-sans font-medium text-sm text-core-black">Delete channel</p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">
                    Permanently removes the channel and all its video associations. Videos themselves are not deleted.
                  </p>
                </div>
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={deleteChannel}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 h-8 px-4 rounded-full bg-red-500 font-sans font-medium text-xs text-white disabled:opacity-50"
                    >
                      {deleting && <Loader2 size={12} className="animate-spin" />}
                      Yes, delete it
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border border-red-200 font-sans font-medium text-xs text-red-500 hover:bg-red-50 transition-colors w-fit"
                  >
                    <Trash2 size={12} />
                    Delete channel
                  </button>
                )}
              </div>
            )}

          </div>

          <div className="px-6 py-5 border-t border-border flex items-center justify-between gap-3">
            {error && <p className="font-sans text-xs text-red-500 flex-1">{error}</p>}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim() || coverUploading}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-core-black font-sans font-medium text-sm text-white disabled:opacity-40 transition-opacity"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </div>

        </SheetContent>
      </Sheet>
    </>
  )
}
