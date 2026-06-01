"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PenSquare, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UserResult {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export function NewMessageButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)

  async function handleSearch(q: string) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
    if (res.ok) setResults(await res.json())
    setSearching(false)
  }

  async function startConversation(recipientId: string) {
    setStarting(recipientId)
    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId }),
    })
    if (res.ok) {
      const { id } = await res.json()
      setOpen(false)
      router.push(`/messages/${id}`)
    }
    setStarting(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
        aria-label="New message"
      >
        <PenSquare size={14} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="font-sans font-semibold text-sm">New Message</DialogTitle>
          </DialogHeader>

          <div className="relative px-4 py-3 border-b border-border">
            <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full rounded-full border border-border bg-foreground/5 pl-8 pr-4 py-2 font-sans text-sm focus:outline-none focus:border-black/20 transition-colors"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {searching && (
              <div className="px-4 py-6 text-center font-sans text-xs text-foreground/40">Searching…</div>
            )}
            {!searching && results.length === 0 && query.trim() && (
              <div className="px-4 py-6 text-center font-sans text-xs text-foreground/40">No users found</div>
            )}
            {!searching && results.length === 0 && !query.trim() && (
              <div className="px-4 py-6 text-center font-sans text-xs text-foreground/40">Search for someone to message</div>
            )}
            {results.map((u) => {
              const initials = u.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
              return (
                <button
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  disabled={starting === u.id}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left"
                >
                  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-spring-green flex items-center justify-center">
                    {u.avatarUrl ? (
                      <Image src={u.avatarUrl} alt={u.displayName} width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-sans font-bold text-xs text-core-black">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-medium text-sm text-core-black truncate">{u.displayName}</p>
                    <p className="font-sans text-xs text-foreground/40 truncate">@{u.username}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
