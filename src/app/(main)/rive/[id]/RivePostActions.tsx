"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  threadId:    string
  initialTitle: string
  initialUrl:   string
  initialBody:  string
}

export function RivePostActions({ threadId, initialTitle, initialUrl, initialBody }: Props) {
  const router = useRouter()

  // ── Delete state ──────────────────────────────────────────
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" })
    router.push("/rive")
    router.refresh()
  }

  // ── Edit modal state ───────────────────────────────────────
  const [editOpen,   setEditOpen]   = useState(false)
  const [title,      setTitle]      = useState(initialTitle)
  const [riveUrl,    setRiveUrl]    = useState(initialUrl)
  const [description,setDescription]= useState(initialBody)
  const [saving,     setSaving]     = useState(false)
  const [editError,  setEditError]  = useState<string | null>(null)

  const urlValid = riveUrl.trim().startsWith("https://")

  function openEdit() {
    setTitle(initialTitle)
    setRiveUrl(initialUrl)
    setDescription(initialBody)
    setEditError(null)
    setEditOpen(true)
  }

  function handleEditOpenChange(next: boolean) {
    if (!next) setEditError(null)
    setEditOpen(next)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !urlValid || saving) return

    setSaving(true)
    setEditError(null)

    const res = await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: description.trim(),
        riveUrls: [riveUrl.trim()],
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setEditError(data.error ?? "Something went wrong.")
      setSaving(false)
      return
    }

    setEditOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={openEdit}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-3 font-sans text-xs text-foreground/50 transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Pencil size={11} /> Edit
        </button>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-3 font-sans text-xs text-foreground/50 transition-colors hover:border-red-200 hover:text-red-500"
          >
            <Trash2 size={11} /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-foreground/50">Delete this post?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-7 items-center rounded-full bg-red-500 px-3 font-sans text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-sans font-bold text-lg text-core-black">
            Edit post
          </DialogTitle>

          <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="h-11 rounded-xl border border-border bg-white px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-core-black">
                Rive embed URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={riveUrl}
                onChange={(e) => setRiveUrl(e.target.value)}
                placeholder="https://rive.app/s/…/embed"
                required
                className="h-11 rounded-xl border border-border bg-white px-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
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
                className="resize-none rounded-xl border border-border bg-white px-3 py-2.5 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green/50"
              />
            </div>

            {editError && (
              <p className="font-sans text-xs text-red-500">{editError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleEditOpenChange(false)}
                className="inline-flex h-9 items-center rounded-full border border-border px-5 font-sans text-sm font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !urlValid || saving}
                className="inline-flex h-9 items-center rounded-full bg-spring-green px-5 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
