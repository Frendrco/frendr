"use client"

import { useState } from "react"
import { Megaphone } from "lucide-react"

const MAX = 5000

export default function BroadcastPage() {
  const [subject, setSubject]       = useState("")
  const [message, setMessage]       = useState("")
  const [sendEmail, setSendEmail]   = useState(false)
  const [sending, setSending]       = useState(false)
  const [result, setResult]         = useState<{ count: number; emailCount: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)

  async function handleSend() {
    if (!message.trim() || sending) return
    if (sendEmail && !subject.trim()) { setError("Subject is required when sending email."); return }
    setSending(true)
    setResult(null)
    setError(null)

    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim(), subject: subject.trim() || undefined, sendEmail }),
    })

    const data = await res.json() as { count?: number; emailCount?: number; error?: string }
    setSending(false)

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.")
    } else {
      setResult({ count: data.count ?? 0, emailCount: data.emailCount ?? 0 })
      setMessage("")
      setSubject("")
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

        {/* Email toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setSendEmail(v => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${sendEmail ? "bg-spring-green" : "bg-foreground/20"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${sendEmail ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="font-sans text-sm text-foreground">Also send as email</span>
        </label>

        {/* Subject — only shown when email is on */}
        {sendEmail && (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-medium text-foreground/50">Subject</label>
            <input
              type="text"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
              placeholder="What's the subject line?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-sans text-xs font-medium text-foreground/50">Message</label>
            <span className={`font-sans text-xs ${message.length > MAX ? "text-red-500" : "text-foreground/30"}`}>
              {message.length}/{MAX}
            </span>
          </div>
          <textarea
            rows={10}
            maxLength={MAX}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
            placeholder={sendEmail ? "Write your message. Blank lines become paragraph breaks in the email." : "What's new? This will appear in every user's notification bell…"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {sendEmail && (
            <p className="font-sans text-xs text-foreground/30">Blank lines = paragraph breaks in the email. The first 500 chars also go to the in-app notification bell.</p>
          )}
        </div>

        {error && <p className="font-sans text-xs text-red-500">{error}</p>}

        {result && (
          <p className="font-sans text-xs text-spring-green">
            Sent in-app to {result.count} {result.count === 1 ? "user" : "users"}.
            {result.emailCount > 0 && ` Emailed ${result.emailCount}.`}
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={!message.trim() || message.length > MAX || sending || (sendEmail && !subject.trim())}
          className="h-10 self-end rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed dark:bg-white dark:text-core-black dark:hover:bg-white/90"
        >
          {sending ? "Sending…" : sendEmail ? "Send to all users + email" : "Send to all users"}
        </button>
      </div>
    </div>
  )
}
