"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  playlist: { id: string; name: string; description: string | null; isPublic: boolean }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const field = "h-10 w-full rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

export function EditPlaylistModal({ playlist, open, onOpenChange }: Props) {
  const router = useRouter()
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description ?? "")
  const [isPublic, setIsPublic] = useState(playlist.isPublic)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, isPublic }),
      })
      router.refresh()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="font-sans text-base font-semibold text-core-black">
          Edit playlist
        </DialogTitle>

        <div className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className={`${field} h-20 resize-none py-2.5`}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Visibility toggle */}
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className="flex items-center gap-2 self-start rounded-full border border-border px-3 py-1.5 font-sans text-xs font-medium text-foreground/60 hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            {isPublic ? <Globe size={12} /> : <Lock size={12} />}
            {isPublic ? "Public" : "Private"}
          </button>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
            Cancel
          </DialogClose>
          <Button
            className="rounded-xl bg-spring-green text-core-black hover:bg-spring-green/90"
            disabled={!name.trim() || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
