"use client"

import { useState } from "react"
import { Share2, Check, Link2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Props {
  title?: string
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

export function ShareButton({ title = "" }: Props) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== "undefined" ? window.location.href : ""

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback for non-secure contexts
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Share"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Share2 size={15} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-sans font-semibold text-base text-core-black">Share</DialogTitle>
        </DialogHeader>

        {/* Copy link row */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="flex-1 truncate font-sans text-sm text-foreground/50">{url}</span>
          <button
            onClick={copyLink}
            aria-label="Copy link"
            className="shrink-0 text-foreground/40 transition-colors hover:text-foreground"
          >
            {copied ? <Check size={14} className="text-spring-green" /> : <Link2 size={14} />}
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
      </DialogContent>
    </Dialog>
  )
}
