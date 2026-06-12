"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function NewEventForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [isOnline, setIsOnline] = useState(false)
  const [location, setLocation] = useState("")
  const [onlineUrl, setOnlineUrl] = useState("")
  const [maxAttendees, setMaxAttendees] = useState("")
  const [lgbtqFriendly, setLgbtqFriendly] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !date || !time) return
    setSubmitting(true)
    setError(null)

    const dateTime = new Date(`${date}T${time}`).toISOString()

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        date: dateTime,
        location: isOnline ? null : location,
        onlineUrl: isOnline ? onlineUrl : null,
        maxAttendees: maxAttendees || null,
        lgbtqFriendly,
      }),
    })

    if (!res.ok) {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    router.push("/community/events")
  }

  const field = "w-full h-11 rounded-xl border border-border bg-background px-4 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Event Title</label>
        <input className={field} placeholder="Motion Design Meetup — June 2026" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Date</label>
          <input className={field} type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Time</label>
          <input className={field} type="time" value={time} onChange={e => setTime(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOnline(false)}
            className={`h-8 rounded-full px-4 font-sans text-xs font-medium transition-colors ${!isOnline ? "bg-core-black text-white" : "border border-border text-foreground/50 hover:text-foreground"}`}
          >
            In-person
          </button>
          <button
            type="button"
            onClick={() => setIsOnline(true)}
            className={`h-8 rounded-full px-4 font-sans text-xs font-medium transition-colors ${isOnline ? "bg-core-black text-white" : "border border-border text-foreground/50 hover:text-foreground"}`}
          >
            Online
          </button>
        </div>
        {isOnline ? (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-medium text-foreground/50">Event Link</label>
            <input className={field} type="url" placeholder="https://zoom.us/j/…" value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-medium text-foreground/50">Location</label>
            <input className={field} placeholder="Studio address or city" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Max Attendees <span className="text-foreground/30">(optional)</span></label>
        <input className={field} type="number" min="1" placeholder="Leave blank for unlimited" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Description</label>
        <textarea
          rows={6}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
          placeholder="What's happening, who should come, what to bring…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={lgbtqFriendly}
          onChange={e => setLgbtqFriendly(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-spring-green"
        />
        <span className="font-sans text-sm text-foreground/70">🏳️‍🌈 This is an LGBTQ+ friendly event</span>
      </label>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => router.back()} className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !description.trim() || !date || !time || submitting}
          className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating…" : "Create Event"}
        </button>
      </div>
    </form>
  )
}
