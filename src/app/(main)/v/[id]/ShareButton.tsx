"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // fallback for non-secure contexts
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Share"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      {copied ? <Check size={15} className="text-spring-green" /> : <Share2 size={15} />}
    </button>
  )
}
