"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pin, PinOff } from "lucide-react"

interface Props {
  videoId: string
  isPinned: boolean
}

export function PinButton({ videoId, isPinned }: Props) {
  const router          = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setBusy(true)
    await fetch(`/api/videos/${videoId}/pin`, { method: "POST" })
    router.refresh()
    setBusy(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={isPinned ? "Unpin from profile" : "Pin to profile"}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 disabled:opacity-50"
    >
      {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
    </button>
  )
}
