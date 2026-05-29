"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function FeatureButton({ videoId, initialFeatured }: { videoId: string; initialFeatured: boolean }) {
  const [featured, setFeatured] = useState(initialFeatured)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    const res = await fetch(`/api/videos/${videoId}/feature`, { method: "POST" })
    if (res.ok) {
      const data = await res.json() as { featured: boolean }
      setFeatured(data.featured)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={featured ? "Remove from Frendr Selects" : "Add to Frendr Selects"}
      title={featured ? "Remove from Frendr Selects" : "Add to Frendr Selects"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        featured
          ? "border-spring-green bg-spring-green/10 text-core-black hover:bg-spring-green/20"
          : "border-border text-foreground/40 hover:border-foreground/30 hover:text-foreground"
      )}
    >
      <Star size={15} className={featured ? "fill-current" : ""} />
    </button>
  )
}
