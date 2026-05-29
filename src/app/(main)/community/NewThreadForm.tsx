"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bold, Italic, Link2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TAGS = [
  "Discussion", "Help", "Showcase", "News",
  "Tools", "Resources", "Feedback", "Off-topic",
]

export function NewThreadForm() {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle]         = useState("")
  const [body, setBody]           = useState("")
  const [tags, setTags]           = useState<string[]>([])
  const [videoUrl, setVideoUrl]   = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([""])
  const [riveUrls, setRiveUrls]   = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // ── Rich text helpers ────────────────────────────────────────
  function applyFormat(format: "bold" | "italic" | "link") {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const sel   = body.slice(start, end)

    let replacement = ""
    if (format === "bold")   replacement = `**${sel || "bold text"}**`
    if (format === "italic") replacement = `*${sel || "italic text"}*`
    if (format === "link") {
      const url = window.prompt("Enter URL:")
      if (!url) return
      replacement = `[${sel || "link text"}](${url})`
    }

    const next = body.slice(0, start) + replacement + body.slice(end)
    setBody(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  // ── Tags ─────────────────────────────────────────────────────
  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  // ── Image URLs ───────────────────────────────────────────────
  function setImageUrl(i: number, val: string) {
    setImageUrls(prev => prev.map((u, idx) => idx === i ? val : u))
  }
  function removeImageUrl(i: number) {
    setImageUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Rive URLs ────────────────────────────────────────────────
  function setRiveUrl(i: number, val: string) {
    setRiveUrls(prev => prev.map((u, idx) => idx === i ? val : u))
  }
  function removeRiveUrl(i: number) {
    setRiveUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     title.trim(),
        body:      body.trim(),
        tags,
        videoUrl:  videoUrl.trim() || null,
        imageUrls: imageUrls.filter(u => u.trim()),
        riveUrls:  riveUrls.filter(u => u.trim()),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setError(data.error ?? "Something went wrong. Please try again.")
      setSubmitting(false)
      return
    }

    const thread = await res.json() as { id: string }
    router.push(`/community/${thread.id}`)
  }

  const inputCls = "w-full h-11 rounded-xl border border-border bg-white px-4 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Title</label>
        <input
          className={inputCls}
          placeholder="What do you want to discuss?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-3 font-sans text-xs font-medium transition-colors",
                tags.includes(tag)
                  ? "border-core-black bg-core-black text-white"
                  : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {tags.includes(tag) && <X size={10} />}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Body with toolbar */}
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Body</label>
        <div className="overflow-hidden rounded-xl border border-border focus-within:ring-2 focus-within:ring-spring-green">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 border-b border-border bg-foreground/[0.02] px-3 py-2">
            {[
              { format: "bold"   as const, icon: <Bold   size={14} />, title: "Bold"   },
              { format: "italic" as const, icon: <Italic size={14} />, title: "Italic" },
              { format: "link"   as const, icon: <Link2  size={14} />, title: "Link"   },
            ].map(({ format, icon, title: t }) => (
              <button
                key={format}
                type="button"
                title={t}
                onClick={() => applyFormat(format)}
                className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                {icon}
              </button>
            ))}
          </div>
          <textarea
            ref={bodyRef}
            rows={10}
            className="w-full resize-none bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
            placeholder="Share your thoughts…"
            value={body}
            onChange={e => setBody(e.target.value)}
            required
          />
        </div>
        <p className="font-sans text-[11px] text-foreground/30">Supports **bold**, *italic*, and [links](url)</p>
      </div>

      {/* Video embed */}
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-xs font-medium text-foreground/50">Video embed <span className="text-foreground/30">(optional)</span></label>
        <input
          className={inputCls}
          placeholder="YouTube, Vimeo, Instagram, or Framer URL"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
        />
      </div>

      {/* Image URLs */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Images <span className="text-foreground/30">(optional — paste a URL)</span></label>
        {imageUrls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              placeholder="https://… (image URL)"
              value={url}
              onChange={e => setImageUrl(i, e.target.value)}
            />
            {imageUrls.length > 1 && (
              <button
                type="button"
                onClick={() => removeImageUrl(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImageUrls(prev => [...prev, ""])}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <Plus size={13} /> Add another image
        </button>
      </div>

      {/* Rive embeds */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs font-medium text-foreground/50">Rive embeds <span className="text-foreground/30">(optional)</span></label>
        {riveUrls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              placeholder="e.g. https://rive.app/s/YOUR_ID/embed"
              value={url}
              onChange={e => setRiveUrl(i, e.target.value)}
            />
            {riveUrls.length > 1 && (
              <button
                type="button"
                onClick={() => removeRiveUrl(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRiveUrls(prev => [...prev, ""])}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <Plus size={13} /> Add another Rive embed
        </button>
      </div>

      {error && <p className="font-sans text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !body.trim() || submitting}
          className="h-10 rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting…" : "Post Thread"}
        </button>
      </div>
    </form>
  )
}
