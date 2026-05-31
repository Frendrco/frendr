"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function DeleteShopButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch("/api/marketplace", { method: "DELETE" })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-sans text-xs text-foreground/50">Remove your shop?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-7 items-center rounded-full bg-red-500 px-3 font-sans text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? "Removing…" : "Yes, remove"}
        </button>
        <button onClick={() => setConfirming(false)} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 font-sans text-xs text-foreground/50 transition-colors hover:border-red-200 hover:text-red-500"
    >
      <Trash2 size={11} /> Remove Shop
    </button>
  )
}
