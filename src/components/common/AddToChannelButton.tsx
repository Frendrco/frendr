"use client"

import { useState, useCallback } from "react"
import { Monitor, Check, Loader2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

type Channel = {
  id: string
  name: string
  slug: string
  color: string | null
  inChannel: boolean
}

export function AddToChannelButton({ videoId, triggerClassName }: { videoId: string; triggerClassName?: string }) {
  const { isSignedIn } = useAuth()
  const [open, setOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/channels?mine=true&videoId=${videoId}`)
      if (res.ok) setChannels(await res.json())
    } finally {
      setLoading(false)
    }
  }, [videoId])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) fetchChannels()
  }

  const toggle = async (channel: Channel) => {
    const next = !channel.inChannel
    setSaving(channel.id)
    setError(null)
    // Optimistic update
    setChannels((prev) => prev.map((c) => c.id === channel.id ? { ...c, inChannel: next } : c))
    try {
      const res = next
        ? await fetch(`/api/channels/${channel.id}/videos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId }),
          })
        : await fetch(`/api/channels/${channel.id}/videos/${videoId}`, { method: "DELETE" })

      if (!res.ok) {
        // Revert on failure
        setChannels((prev) => prev.map((c) => c.id === channel.id ? { ...c, inChannel: !next } : c))
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? `Failed (${res.status})`)
      }
    } catch {
      setChannels((prev) => prev.map((c) => c.id === channel.id ? { ...c, inChannel: !next } : c))
      setError("Network error")
    } finally {
      setSaving(null)
    }
  }

  if (!isSignedIn) return null

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          className={triggerClassName ?? "flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"}
          title="Add to channel"
        >
          <Monitor size={14} />
        </PopoverTrigger>

        <PopoverContent
          className="w-56 p-0 overflow-hidden"
          align="end"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <div className="px-3 py-2.5 border-b border-border">
            <p className="font-sans font-semibold text-xs text-core-black">Add to channel</p>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-foreground/40" />
              </div>
            ) : channels.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-3 py-5 text-center">
                <Monitor size={18} className="text-foreground/20" />
                <p className="font-sans text-xs text-foreground/40">No channels yet</p>
                <Link
                  href="/channels"
                  className="font-sans text-xs text-spring-green hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Create one
                </Link>
              </div>
            ) : (
              <>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggle(ch)}
                    disabled={saving === ch.id}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-foreground/4 transition-colors disabled:opacity-50"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{ background: ch.color ?? "#e5e7eb" }}
                    />
                    <span className="flex-1 truncate font-sans text-sm text-left text-core-black">{ch.name}</span>
                    {saving === ch.id
                      ? <Loader2 size={13} className="shrink-0 animate-spin text-foreground/40" />
                      : ch.inChannel
                        ? <Check size={13} className="shrink-0 text-spring-green" strokeWidth={2.5} />
                        : null
                    }
                  </button>
                ))}
                {error && (
                  <p className="px-3 py-2 font-sans text-xs text-red-500 border-t border-border">{error}</p>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
