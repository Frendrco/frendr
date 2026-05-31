"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Lock, Loader2, Check } from "lucide-react"

const COLORS: { name: string; hex: string }[] = [
  { name: "spring-green",   hex: "#5CE65C" },
  { name: "winter-green",   hex: "#B9FFB2" },
  { name: "bloom-lavender", hex: "#EDC1F6" },
  { name: "sky-blue",       hex: "#ADD8F6" },
  { name: "sunny-yellow",   hex: "#FFDC7C" },
  { name: "hyper-blue",     hex: "#619EF1" },
  { name: "dream-lilac",    hex: "#DCE0FA" },
]

export function CreateChannelForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [color, setColor] = useState(COLORS[0].name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, isPublic, color }),
      })
      if (res.ok) {
        const channel = await res.json()
        router.push(`/channels/${channel.slug}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-core-black">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My favourite loops"
          maxLength={60}
          className="h-9 rounded-lg border border-border bg-transparent px-3 font-sans text-sm outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-core-black">Description <span className="font-normal text-foreground/40">(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel about?"
          rows={3}
          maxLength={280}
          className="rounded-lg border border-border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-core-black">Colour</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c.name)}
              className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: c.hex }}
              aria-label={c.name}
            >
              {color === c.name && (
                <Check size={12} className="absolute inset-0 m-auto text-core-black/60" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsPublic((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 font-sans text-sm text-foreground/70 hover:border-foreground/30 transition-colors"
      >
        {isPublic ? <Globe size={14} className="text-foreground/50" /> : <Lock size={14} className="text-foreground/50" />}
        <span>{isPublic ? "Public — anyone can see this channel" : "Private — only you can see this channel"}</span>
      </button>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="h-9 rounded-full bg-core-black font-sans font-medium text-sm text-white disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Create Channel
      </button>
    </form>
  )
}
