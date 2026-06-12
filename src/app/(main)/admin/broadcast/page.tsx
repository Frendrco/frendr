"use client"

import { useState } from "react"
import { Megaphone } from "lucide-react"

const MAX = 500

export default function BroadcastPage() {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    setResult(null)
    setError(null)

    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() }),
    })

    const data = await res.json() as { count?: number; error?: string }
    setSending(false)

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.")
    } else {
      setResult({ count: data.count ?? 0 })
      setMessage("")
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-spring-green">
          <Megaphone size={16} className="text-core-black" />
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg text-foreground">Broadcast</h1>
          <p className="font-sans text-xs text-foreground/40">Send an announcement to all users</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-sans text-xs font-medium text-foreground/50">Message</label>
            <span className={`font-sans text-xs ${message.length > MAX ? "text-red-500" : "text-foreground/30"}`}>
              {message.length}/{MAX}
            </span>
          </div>
          <textarea
            rows={5}
            maxLength={MAX}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
            placeholder="What's new? This will appear in every user's notification bell…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {error && <p className="font-sans text-xs text-red-500">{error}</p>}

        {result && (
          <p className="font-sans text-xs text-spring-green">
            Sent to {result.count} {result.count === 1 ? "user" : "users"}.
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={!message.trim() || message.length > MAX || sending}
          className="h-10 self-end rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed dark:bg-white dark:text-core-black dark:hover:bg-white/90"
        >
          {sending ? "Sending…" : "Send to all users"}
        </button>
      </div>
    </div>
  )
}
