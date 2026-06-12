"use client"

import { useState } from "react"
import { Pencil, Link2, Check } from "lucide-react"
import { EditPlaylistModal } from "../EditPlaylistModal"

interface Playlist {
  id: string
  name: string
  description: string | null
  isPublic: boolean
}

export function PlaylistDetailActions({ playlist, username }: { playlist: Playlist; username: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${username}/playlists/${playlist.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 font-sans font-medium text-xs text-foreground/60 hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          {copied ? <Check size={12} className="text-spring-green" /> : <Link2 size={12} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 font-sans font-medium text-xs text-foreground/60 hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>

      <EditPlaylistModal playlist={playlist} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
