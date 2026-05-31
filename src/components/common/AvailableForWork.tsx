"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  initial: boolean
  isOwn: boolean
}

export function AvailableForWork({ initial, isOwn }: Props) {
  const [available, setAvailable] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (!isOwn || saving) return
    setSaving(true)
    setAvailable((v) => !v)
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openToWork: !available }),
    })
    setSaving(false)
  }

  // Visitors only see the badge when the creator is available
  if (!isOwn && !available) return null

  return (
    <button
      onClick={toggle}
      disabled={!isOwn || saving}
      className={cn(
        "self-start inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-medium transition-colors",
        available
          ? "bg-green-50 text-green-700"
          : "bg-foreground/5 text-foreground/40",
        isOwn && "cursor-pointer hover:opacity-80",
        !isOwn && "cursor-default"
      )}
    >
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        available ? "bg-green-500" : "bg-foreground/30"
      )} />
      {available ? "Available for work" : "Not available"}
    </button>
  )
}
