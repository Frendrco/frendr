"use client"

import { useState, useCallback } from "react"
import { Bookmark, Clock, Plus, Lock, Globe, Loader2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

type Playlist = {
  id: string
  name: string
  isPublic: boolean
  isDefault: boolean
  hasVideo: boolean
}

type Props = {
  videoId: string
  triggerClassName?: string
  initialSaved?: boolean
}

export function AddToPlaylistButton({ videoId, triggerClassName, initialSaved }: Props) {
  const { isSignedIn } = useAuth()
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPublic, setNewPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchPlaylists = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const res = await fetch(`/api/playlists?videoId=${videoId}`)
      if (res.ok) setPlaylists(await res.json())
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, videoId])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) fetchPlaylists()
  }

  const handleWatchLaterToggle = async () => {
    const existing = playlists.find(p => p.isDefault)
    if (existing) {
      setPlaylists(prev => prev.map(p => p.isDefault ? { ...p, hasVideo: !p.hasVideo } : p))
    }
    await fetch("/api/playlists/watch-later", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    })
    if (!existing) fetchPlaylists()
  }

  const togglePlaylist = async (playlist: Playlist) => {
    const next = !playlist.hasVideo
    setPlaylists((prev) => prev.map((p) => p.id === playlist.id ? { ...p, hasVideo: next } : p))
    if (next) {
      await fetch(`/api/playlists/${playlist.id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
    } else {
      await fetch(`/api/playlists/${playlist.id}/videos/${videoId}`, { method: "DELETE" })
    }
  }

  const createPlaylist = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), isPublic: newPublic }),
      })
      if (res.ok) {
        const created = await res.json()
        // Immediately add the video to the new playlist
        await fetch(`/api/playlists/${created.id}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
        setPlaylists((prev) => [...prev, { ...created, hasVideo: true }])
        setNewName("")
        setNewPublic(false)
        setShowNewForm(false)
      }
    } finally {
      setCreating(false)
    }
  }

  if (!isSignedIn) return null

  const watchLaterPlaylist = playlists.find(p => p.isDefault)
  const regularPlaylists = playlists.filter(p => !p.isDefault)
  const isSaved = watchLaterPlaylist?.hasVideo ?? initialSaved ?? false

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          className={triggerClassName ?? "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 shadow text-foreground hover:bg-white dark:hover:bg-white/10 transition-colors"}
          title="Save to playlist"
        >
          <Bookmark size={14} className={isSaved ? "fill-current" : ""} />
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 overflow-hidden"
          align="end"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <div className="px-3 py-2.5 border-b border-border">
            <p className="font-sans font-semibold text-xs text-foreground">Save to</p>
          </div>

          {/* Watch Later — always first */}
          <button
            onClick={handleWatchLaterToggle}
            className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-foreground/4 transition-colors border-b border-border"
          >
            <Checkbox checked={watchLaterPlaylist?.hasVideo ?? false} className="pointer-events-none" />
            <Clock size={13} className="shrink-0 text-foreground/50" />
            <span className="flex-1 truncate font-sans text-sm text-left text-foreground">Watch Later</span>
          </button>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-foreground/40" />
              </div>
            ) : regularPlaylists.length === 0 ? (
              <p className="px-3 py-4 font-sans text-xs text-foreground/40">No playlists yet</p>
            ) : (
              regularPlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => togglePlaylist(pl)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-foreground/4 transition-colors"
                >
                  <Checkbox checked={pl.hasVideo} className="pointer-events-none" />
                  <span className="flex-1 truncate font-sans text-sm text-left text-foreground">{pl.name}</span>
                  {pl.isPublic ? (
                    <Globe size={11} className="shrink-0 text-foreground/30" />
                  ) : (
                    <Lock size={11} className="shrink-0 text-foreground/30" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* New playlist form */}
          <div className="border-t border-border">
            {showNewForm ? (
              <div className="p-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                  placeholder="Playlist name"
                  className="h-8 w-full rounded-md border border-border bg-transparent px-2.5 font-sans text-sm outline-none focus:border-foreground/30"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setNewPublic((v) => !v)}
                    className="flex items-center gap-1.5 font-sans text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
                  >
                    {newPublic ? <Globe size={12} /> : <Lock size={12} />}
                    {newPublic ? "Public" : "Private"}
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setShowNewForm(false); setNewName("") }}
                      className="h-7 rounded-full px-3 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createPlaylist}
                      disabled={!newName.trim() || creating}
                      className="h-7 rounded-full bg-core-black dark:bg-white px-3 font-sans text-xs text-white dark:text-core-black disabled:opacity-40 transition-opacity"
                    >
                      {creating ? <Loader2 size={12} className="animate-spin" /> : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewForm(true)}
                className="flex w-full items-center gap-2 px-3 py-2.5 font-sans text-sm text-foreground/60 hover:text-foreground hover:bg-foreground/4 transition-colors"
              >
                <Plus size={14} />
                New playlist
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
