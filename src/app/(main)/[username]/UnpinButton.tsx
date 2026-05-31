"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function UnpinButton({ videoId }: { videoId: string }) {
  const router       = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleUnpin() {
    setBusy(true)
    await fetch(`/api/videos/${videoId}/pin`, { method: "POST" })
    router.refresh()
  }

  return (
    <button
      onClick={handleUnpin}
      disabled={busy}
      className="font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors disabled:opacity-50"
    >
      {busy ? "Unpinning…" : "Unpin"}
    </button>
  )
}
