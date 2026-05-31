"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  recipientId: string
  size?: "sm" | "md"
}

export function MessageButton({ recipientId, size = "md" }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId }),
    })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/messages/${id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-border font-sans font-medium transition-colors hover:bg-foreground/5",
        size === "md" ? "h-9 w-full text-sm" : "h-8 px-3 text-xs"
      )}
    >
      <MessageCircle size={size === "md" ? 13 : 12} />
      {loading ? "Opening…" : "Message"}
    </button>
  )
}
