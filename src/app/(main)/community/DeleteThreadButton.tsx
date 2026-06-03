"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function DeleteThreadButton({ threadId }: { threadId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm("Delete this thread?")) return
    setLoading(true)
    try {
      await fetch(`/api/threads/${threadId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Delete thread"
      className="flex items-center justify-center text-foreground/30 hover:text-red-500 transition-colors disabled:opacity-40"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Trash2 size={15} />
      )}
    </button>
  )
}
