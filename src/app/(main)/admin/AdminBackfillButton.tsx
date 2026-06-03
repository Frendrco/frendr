"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

export function AdminBackfillButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ processed: number; updated: number } | null>(null)

  async function run() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/videos/backfill-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      const data = await res.json() as { processed: number; updated: number }
      setResult(data)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 font-sans font-medium text-sm text-foreground/70 hover:border-foreground/30 hover:text-core-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        Backfill missing metadata
      </button>
      {result && (
        <span className="font-sans text-xs text-foreground/50">
          {result.updated} of {result.processed} updated
        </span>
      )}
    </div>
  )
}
