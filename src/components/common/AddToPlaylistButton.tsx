"use client"

import { useState, useCallback } from "react"
import { Bookmark, Clock, Plus, Lock, Globe, Check, Loader2 } from "lucide-react"
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
}

export function AddToPlaylistButton({ videoId }: Props) {
  const { isSignedIn } = useAuth()
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [watchLaterSaved, setWatchLaterSaved] = useState(false)
  const [watchLaterLoading, setWatchLaterLoading] = useState(false)
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

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isSignedIn) return
    setWatchLaterLoading(true)
    try {
      await fetch("/api/playlists/watch-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
      setWatchLaterSaved(true)
      setTimeout(() => setWatchLaterSaved(false), 2000)
    } finally {
      setWatchLaterLoading(false)
    }
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

  return (
    <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      {/* Watch Later quick-save */}
      <button
        onClick={handleWatchLater}
        disabled={watchLaterLoading}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow text-core-black hover:bg-white transition-colors"
        title="Save to Watch Later"
      >
        {watchLaterLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : watchLaterSaved ? (
          <Check size={14} className="text-spring-green" />
        ) : (
          <Clock size={14} />
        )}
      </button>

      {/* Add to playlist popover */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow text-core-black hover:bg-white transition-colors"
          title="Add to playlist"
        >
          <Bookmark size={14} />
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 overflow-hidden"
          align="end"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <div className="px-3 py-2.5 border-b border-border">
            <p className="font-sans font-semibold text-xs text-core-black">Add to playlist</p>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-foreground/40" />
              </div>
            ) : playlists.length === 0 ? (
              <p className="px-3 py-4 font-sans text-xs text-foreground/40">No playlists yet</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => togglePlaylist(pl)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-foreground/4 transition-colors"
                >
                  <Checkbox checked={pl.hasVideo} className="pointer-events-none" />
                  <span className="flex-1 truncate font-sans text-sm text-left text-core-black">{pl.name}</span>
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
                      className="h-7 rounded-full bg-core-black px-3 font-sans text-xs text-white disabled:opacity-40 transition-opacity"
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
