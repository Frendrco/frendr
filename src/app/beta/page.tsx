"use client"

import Image from "next/image"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function BetaPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.href = "/"
      } else {
        setError("Incorrect password. Try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center">

        <Image
          src="/images/logo-wordmark.svg"
          alt="frendr"
          width={120}
          height={32}
          className="mb-8"
        />

        <p className="font-sans text-sm text-foreground/50 mb-8 text-center">
          This is a private beta. Enter the password to continue.
        </p>

        <form onSubmit={submit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Beta password"
            autoFocus
            className="h-11 w-full rounded-full border border-border bg-transparent px-5 font-sans text-sm outline-none focus:border-foreground/30 transition-colors text-center tracking-widest"
          />

          {error && (
            <p className="font-sans text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password.trim() || loading}
            className="h-11 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Enter
          </button>
        </form>

      </div>
    </div>
  )
}
