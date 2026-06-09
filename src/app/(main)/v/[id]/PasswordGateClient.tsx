"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  videoId: string
  title: string
}

export function PasswordGateClient({ videoId, title }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/videos/${videoId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Incorrect password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 px-6 text-center">
        <div>
          <p className="font-sans text-sm text-white/40">Password protected</p>
          <p className="mt-1 font-sans text-base font-medium text-white">{title}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
            autoFocus
          />
          {error && (
            <p className="font-sans text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-spring-green px-6 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-50"
          >
            {loading ? "Unlocking…" : "Watch video"}
          </button>
        </form>
      </div>
    </div>
  )
}
