"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Plus, X, Loader2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { detectProvider, isEmbeddableVideoUrl, getProviderLabel } from "@/lib/videoEmbed"

const MAX_ITEMS = 10

type VideoType  = "PORTFOLIO" | "RECESS"
type Visibility = "public" | "followers" | "private"

interface Row {
  id:           string
  url:          string
  title:        string
  thumbnailUrl: string | null
  provider:     string | null
  status:       "idle" | "loading" | "ready" | "error"
  error?:       string
}

function toApiVisibility(v: Visibility): "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE" {
  if (v === "public")    return "PUBLIC"
  if (v === "followers") return "FOLLOWERS_ONLY"
  return "PRIVATE"
}

const newRow = (): Row => ({
  id: crypto.randomUUID(),
  url: "",
  title: "",
  thumbnailUrl: null,
  provider: null,
  status: "idle",
})

export function ImportClient({ username }: { username: string }) {
  const router = useRouter()
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [rows, setRows]             = useState<Row[]>([newRow()])
  const [videoType, setVideoType]   = useState<VideoType>("PORTFOLIO")
  const [visibility, setVisibility] = useState<Visibility>("public")
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  function patch(id: string, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function lookup(id: string, url: string) {
    const trimmed = url.trim()
    if (!trimmed) return patch(id, { status: "idle", title: "", thumbnailUrl: null, provider: null })

    if (detectProvider(trimmed) === "other") {
      return patch(id, { status: "error", error: "Use a YouTube, Vimeo, Framerate or Dropbox link." })
    }
    if (!isEmbeddableVideoUrl(trimmed)) {
      return patch(id, { status: "error", error: "That looks like a profile or channel page, not a single video." })
    }

    patch(id, { status: "loading", error: undefined, provider: getProviderLabel(detectProvider(trimmed)) })
    try {
      const res = await fetch(`/api/videos/oembed?url=${encodeURIComponent(trimmed)}`)
      const meta = await res.json() as { title: string | null; thumbnailUrl: string | null }
      patch(id, {
        status: "ready",
        title: meta.title ?? "",
        thumbnailUrl: meta.thumbnailUrl,
      })
    } catch {
      // The link may still be valid — let them title it by hand.
      patch(id, { status: "ready" })
    }
  }

  function onUrlChange(id: string, url: string) {
    patch(id, { url })
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => lookup(id, url), 400)
  }

  async function handleImport() {
    const items = rows.filter((r) => r.url.trim() && r.title.trim())
    if (!items.length) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/videos/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((r) => ({
            externalUrl:  r.url.trim(),
            title:        r.title.trim(),
            thumbnailUrl: r.thumbnailUrl,
            videoType,
            visibility:   toApiVisibility(visibility),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not import")

      const slugs: (string | null)[] = data.slugs ?? []
      router.push(items.length === 1 && slugs[0] ? `/v/${slugs[0]}?edit=1` : `/${username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import")
      setSaving(false)
    }
  }

  const canImport = rows.some((r) => r.url.trim() && r.title.trim()) && !saving

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="display-sm mb-2">Import</h1>
      <p className="mb-8 font-sans text-sm text-foreground/50">
        Paste links to work you already have online. Nothing gets re-uploaded &mdash; it stays where it is.
      </p>

      <div className="mb-6 flex items-center gap-2">
        {(["PORTFOLIO", "RECESS"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setVideoType(t)}
            disabled={saving}
            className={cn(
              "h-9 rounded-full px-4 font-sans text-sm font-medium transition-colors",
              videoType === t
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-foreground/60 hover:text-foreground"
            )}
          >
            {t === "PORTFOLIO" ? "Portfolio" : "Recess"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                value={row.url}
                onChange={(e) => onUrlChange(row.id, e.target.value)}
                placeholder="https://vimeo.com/…"
                disabled={saving}
                className="min-w-0 flex-1 bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-foreground/30"
              />
              {row.status === "loading" && <Loader2 size={14} className="shrink-0 animate-spin text-foreground/40" />}
              {row.provider && row.status === "ready" && (
                <span className="shrink-0 font-sans text-xs text-foreground/40">{row.provider}</span>
              )}
              {rows.length > 1 && !saving && (
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  aria-label="Remove"
                >
                  <X size={16} className="text-foreground/30 hover:text-foreground" />
                </button>
              )}
            </div>

            {row.status === "error" && (
              <p className="mt-2 font-sans text-xs text-red-500">{row.error}</p>
            )}

            {row.status === "ready" && (
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                {row.thumbnailUrl && (
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={row.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <input
                  value={row.title}
                  onChange={(e) => patch(row.id, { title: e.target.value })}
                  placeholder="Title"
                  disabled={saving}
                  className="min-w-0 flex-1 bg-transparent font-sans text-sm font-medium text-foreground outline-none placeholder:text-foreground/30"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {rows.length < MAX_ITEMS && !saving && (
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, newRow()])}
          className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm text-foreground/50 transition-colors hover:text-foreground"
        >
          <Plus size={14} />
          Add another
        </button>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/40">
          Who can see it
        </p>
        <div className="flex items-center gap-2">
          {(["public", "followers", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              disabled={saving}
              className={cn(
                "h-9 rounded-full px-4 font-sans text-sm font-medium transition-colors",
                visibility === v
                  ? "bg-foreground text-background"
                  : "bg-foreground/5 text-foreground/60 hover:text-foreground"
              )}
            >
              {v === "public" ? "Everyone" : v === "followers" ? "Followers" : "Only me"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 font-sans text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleImport}
        disabled={!canImport}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-spring-green px-8 font-sans text-sm font-medium text-core-black transition-colors hover:bg-spring-green/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Importing…" : "Import"}
      </button>

      <Link
        href="/dashboard/upload"
        className="mt-4 flex items-center gap-2 font-sans text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        <Upload size={14} />
        Upload a file instead
      </Link>
    </div>
  )
}
