"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Presets", "Templates", "Prints", "Art", "Clothing", "Crafts", "Merch", "Courses", "Assets", "Other"]

type InitialValues = {
  name?: string
  shopUrl?: string
  category?: string | null
  description?: string | null
}

export function ShopForm({ initial }: { initial?: InitialValues }) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? "")
  const [shopUrl, setShopUrl] = useState(initial?.shopUrl ?? "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initial?.name

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !shopUrl.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, shopUrl, category, description }),
    })

    if (!res.ok) {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    router.push("/community/marketplace")
  }

  const field = "w-full h-11 rounded-xl border border-border bg-background px-4 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Shop Name</label>
          <input className={field} placeholder="Ryan's Preset Pack" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-medium text-foreground/50">Shop URL</label>
          <input className={field} type="url" placeholder="https://gumroad.com/yourshop" value={shopUrl} onChange={e => setShopUrl(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat === category ? "" : cat)}
              className={cn(
                "h-8 rounded-full px-4 font-sans text-xs font-medium transition-colors",
                category === cat
                  ? "bg-core-black text-white"
                  : "border border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Description <span className="text-foreground/30">(optional)</span></label>
        <textarea
          rows={4}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
          placeholder="What do you sell? Presets, templates, prints…"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => router.back()} className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !shopUrl.trim() || submitting}
          className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : isEditing ? "Save Changes" : "List My Shop"}
        </button>
      </div>
    </form>
  )
}
