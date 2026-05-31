"use client"

import { useState } from "react"
import { Bookmark, Loader2 } from "lucide-react"

type Props = {
  shopId: string
  initialSaved: boolean
  onUnsave?: () => void
}

export function SaveShopButton({ shopId, initialSaved, onUnsave }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/${shopId}/save`, { method: "POST" })
      const data = await res.json()
      setSaved(data.saved)
      if (!data.saved) onUnsave?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={saved ? "Unsave" : "Save"}
      className="flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors disabled:opacity-40"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Bookmark size={15} className={saved ? "fill-current text-core-black" : ""} />
      )}
    </button>
  )
}
