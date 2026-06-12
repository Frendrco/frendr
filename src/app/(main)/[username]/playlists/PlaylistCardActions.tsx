"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Link2, Trash2, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EditPlaylistModal } from "./EditPlaylistModal"

interface Playlist {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  isDefault: boolean
}

interface Props {
  playlist: Playlist
  username: string
}

export function PlaylistCardActions({ playlist, username }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/${username}/playlists/${playlist.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" })
      router.refresh()
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            {copied ? <Check size={12} /> : <MoreHorizontal size={12} />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-40 p-1">
            <DropdownMenuItem
              className="justify-between px-3 py-1.5 cursor-pointer"
              onClick={(e) => { e.preventDefault(); setEditOpen(true) }}
            >
              <span className="font-sans text-sm">Edit</span>
              <Pencil size={13} strokeWidth={1.5} className="text-foreground/40" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="justify-between px-3 py-1.5 cursor-pointer"
              onClick={(e) => { e.preventDefault(); copyLink() }}
            >
              <span className="font-sans text-sm">{copied ? "Copied!" : "Copy link"}</span>
              {copied ? (
                <Check size={13} strokeWidth={1.5} className="text-spring-green" />
              ) : (
                <Link2 size={13} strokeWidth={1.5} className="text-foreground/40" />
              )}
            </DropdownMenuItem>
            {!playlist.isDefault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-between px-3 py-1.5 cursor-pointer text-red-500 focus:text-red-500"
                  onClick={(e) => { e.preventDefault(); setDeleteOpen(true) }}
                >
                  <span className="font-sans text-sm">Delete</span>
                  <Trash2 size={13} strokeWidth={1.5} />
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditPlaylistModal
        playlist={playlist}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-xs">
          <DialogTitle className="font-sans text-base font-semibold text-foreground">
            Delete playlist?
          </DialogTitle>
          <p className="font-sans text-sm text-foreground/50">
            &ldquo;{playlist.name}&rdquo; will be permanently deleted. Videos inside won&apos;t be affected.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
              Cancel
            </DialogClose>
            <Button
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
