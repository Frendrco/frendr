"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

type Props = {
  eventId: string
  initialAttending: boolean
  initialCount: number
}

export function EventRsvpButton({ eventId, initialAttending, initialCount }: Props) {
  const [attending, setAttending] = useState(initialAttending)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" })
      const data = await res.json()
      setAttending(data.attending)
      setCount(c => data.attending ? c + 1 : c - 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-5 font-sans font-medium text-sm transition-colors disabled:opacity-50 ${
        attending
          ? "bg-spring-green text-core-black hover:bg-spring-green/80"
          : "border border-border text-foreground/60 hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {attending ? "Attending" : "RSVP"}
      <span className="font-normal text-xs opacity-60">{count}</span>
    </button>
  )
}
