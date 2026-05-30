"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Lock, Loader2 } from "lucide-react"

export function CreateAdminChannelForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
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
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, isPublic, type: "admin" }),
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
        <label className="font-sans text-xs font-medium text-core-black">Channel Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Staff Picks"
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

      <button
        type="button"
        onClick={() => setIsPublic((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 font-sans text-sm text-foreground/70 hover:border-foreground/30 transition-colors"
      >
        {isPublic ? <Globe size={14} className="text-foreground/50" /> : <Lock size={14} className="text-foreground/50" />}
        <span>{isPublic ? "Public" : "Private"}</span>
      </button>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="h-9 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Create Channel
      </button>
    </form>
  )
}
