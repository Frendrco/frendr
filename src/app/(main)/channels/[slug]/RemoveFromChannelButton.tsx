"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

type Props = { channelId: string; videoId: string }

export function RemoveFromChannelButton({ channelId, videoId }: Props) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)

  async function remove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    await fetch(`/api/channels/${channelId}/videos/${videoId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={removing}
      title="Remove from channel"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
    >
      {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  )
}
