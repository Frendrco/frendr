"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bold, Italic, Link2, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react"

const TAGS = [
  "Discussion", "Help", "Showcase", "News",
  "Tools", "Resources", "Feedback", "Off-topic",
]

// Inline markdown renderer (mirrors MarkdownBody) for the preview pane
function parseLine(line: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = line.split(pattern)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={i} className="font-semibold text-core-black">{bold[1]}</strong>
    const italic = part.match(/^\*([^*]+)\*$/)
    if (italic) return <em key={i}>{italic[1]}</em>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const href = link[2].startsWith("http") ? link[2] : `https://${link[2]}`
      return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity">{link[1]}</a>
    }
    return part
  })
}

export function NewThreadForm() {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const pendingLink = useRef<{ start: number; end: number; sel: string } | null>(null)

  const [title, setTitle]         = useState("")
  const [body, setBody]           = useState("")
  const [tags, setTags]           = useState<string[]>([])
  const [videoUrl, setVideoUrl]   = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([""])
  const [riveUrls, setRiveUrls]   = useState<string[]>([""])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [tab, setTab]               = useState<"write" | "preview">("write")
  const [linkUrl, setLinkUrl]       = useState<string | null>(null)

  // ── Format helpers ───────────────────────────────────────────
  function applyFormat(format: "bold" | "italic" | "link") {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const sel   = body.slice(start, end)

    if (format === "link") {
      pendingLink.current = { start, end, sel }
      setLinkUrl("")
      setTimeout(() => linkInputRef.current?.focus(), 0)
      return
    }

    const wrap = format === "bold" ? "**" : "*"
    const replacement = `${wrap}${sel || (format === "bold" ? "bold text" : "italic text")}${wrap}`
    const next = body.slice(0, start) + replacement + body.slice(end)
    setBody(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  function confirmLink() {
    const url = linkUrl?.trim()
    if (!url) { setLinkUrl(null); bodyRef.current?.focus(); return }
    const { start, end, sel } = pendingLink.current ?? { start: body.length, end: body.length, sel: "" }
    const replacement = `[${sel || url}](${url})`
    setBody(body.slice(0, start) + replacement + body.slice(end))
    setLinkUrl(null)
    pendingLink.current = null
    setTimeout(() => {
      const el = bodyRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  function handleBodyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") { e.preventDefault(); applyFormat("bold") }
      if (e.key === "i") { e.preventDefault(); applyFormat("italic") }
    }
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
        {/* Label row + Write/Preview tabs */}
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-medium text-foreground/50">Body</label>
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
            {(["write", "preview"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "h-5 rounded-full px-2.5 font-sans text-[11px] font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-core-black text-white"
                    : "text-foreground/40 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border focus-within:ring-2 focus-within:ring-spring-green">
          {/* Toolbar — write mode only */}
          {tab === "write" && (
            <div className="border-b border-border bg-foreground/[0.02]">
              <div className="flex items-center gap-0.5 px-3 py-2">
                {[
                  { format: "bold"   as const, icon: <Bold   size={14} />, title: "Bold (⌘B)"   },
                  { format: "italic" as const, icon: <Italic size={14} />, title: "Italic (⌘I)" },
                  { format: "link"   as const, icon: <Link2  size={14} />, title: "Link"         },
                ].map(({ format, icon, title: t }) => (
                  <button
                    key={format}
                    type="button"
                    title={t}
                    onClick={() => applyFormat(format)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded transition-colors",
                      format === "link" && linkUrl !== null
                        ? "bg-foreground/10 text-foreground"
                        : "text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Inline link input */}
              {linkUrl !== null && (
                <div className="flex items-center gap-2 border-t border-border px-3 py-2">
                  <Link2 size={12} className="shrink-0 text-foreground/30" />
                  <input
                    ref={linkInputRef}
                    type="url"
                    placeholder="https://…"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); confirmLink() }
                      if (e.key === "Escape") { setLinkUrl(null); bodyRef.current?.focus() }
                    }}
                    className="min-w-0 flex-1 bg-transparent font-sans text-xs text-core-black placeholder:text-foreground/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={confirmLink}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-spring-green text-core-black transition-opacity hover:opacity-80"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLinkUrl(null); bodyRef.current?.focus() }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-foreground/30 transition-colors hover:text-foreground"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Write pane */}
          {tab === "write" && (
            <textarea
              ref={bodyRef}
              rows={10}
              className="w-full resize-none bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none"
              placeholder="Share your thoughts…"
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={handleBodyKeyDown}
              required
            />
          )}

          {/* Preview pane */}
          {tab === "preview" && (
            <div className="min-h-[240px] px-4 py-3">
              {body.trim() ? (
                <div className="flex flex-col gap-2">
                  {body.split("\n").map((line, i) => (
                    <p key={i} className="font-sans text-sm text-foreground/80 leading-relaxed">
                      {parseLine(line)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-sm text-foreground/30">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
        <p className="font-sans text-[11px] text-foreground/30">Supports **bold**, *italic*, and [links](url) · ⌘B / ⌘I</p>
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
