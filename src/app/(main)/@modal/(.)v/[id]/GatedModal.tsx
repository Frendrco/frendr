"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Lock } from "lucide-react"

export function GatedModal({ href }: { href: string }) {
  const router = useRouter()
  const close = useCallback(() => router.back(), [router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [close])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-core-black p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={13} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Lock size={20} className="text-white/70" />
        </div>

        <div>
          <p className="font-sans font-semibold text-sm text-white">This video is protected</p>
          <p className="mt-1 font-sans text-xs text-white/40">Enter the password to watch it.</p>
        </div>

        <a
          href={href}
          className="inline-flex h-9 items-center rounded-full bg-white px-6 font-sans text-sm font-medium text-core-black transition-opacity hover:opacity-90"
        >
          View full page
        </a>
      </div>
    </div>
  )
}
