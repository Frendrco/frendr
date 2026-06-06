"use client"

import { useState } from "react"
import { Share2, Check, Link2, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Props {
  title?: string
  videoId: string
  videoSlug?: string | null
}

const SOCIAL_TARGETS = (url: string, title: string) => [
  {
    label: "Twitter / X",
    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: "LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: "Reddit",
    href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
]

export function ShareButton({ title = "", videoId, videoSlug }: Props) {
  const [copiedLink,  setCopiedLink]  = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const urlKey = videoSlug ?? videoId
  const url = typeof window !== "undefined" ? `${window.location.origin}/v/${urlKey}` : `https://frendr.co/v/${urlKey}`
  const embedCode = `<iframe src="https://frendr.co/embed/${urlKey}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`

  async function copyLink() {
    try { await navigator.clipboard.writeText(url) } catch { /* non-secure context */ }
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function copyEmbed() {
    try { await navigator.clipboard.writeText(embedCode) } catch { /* non-secure context */ }
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Share"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Share2 size={15} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-sans font-semibold text-base text-core-black">Share</DialogTitle>
        </DialogHeader>

        {/* Copy link row */}
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-sans text-sm text-foreground/50">{url}</span>
          <button
            onClick={copyLink}
            aria-label="Copy link"
            className="shrink-0 text-foreground/40 transition-colors hover:text-foreground"
          >
            {copiedLink ? <Check size={14} className="text-spring-green" /> : <Link2 size={14} />}
          </button>
        </div>

        {/* Social share buttons */}
        <div className="grid grid-cols-3 gap-2">
          {SOCIAL_TARGETS(url, title).map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-border px-2 py-2.5 font-sans text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/4 hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Embed code */}
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/40">Embed</p>
            <button
              type="button"
              onClick={copyEmbed}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
            >
              {copiedEmbed ? <Check size={11} className="text-spring-green" /> : <Copy size={11} />}
              {copiedEmbed ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="w-full overflow-hidden rounded-xl border border-border bg-foreground/[0.02] px-4 py-3 font-mono text-xs text-foreground/50 leading-relaxed whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
