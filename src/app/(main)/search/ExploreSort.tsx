"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

const OPTIONS = [
  { value: "newest",   label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "following", label: "Following" },
] as const

type SortValue = typeof OPTIONS[number]["value"]

export function ExploreSort({ current }: { current: SortValue }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const select = (value: SortValue) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`/search?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  const currentLabel = OPTIONS.find(o => o.value === current)?.label ?? "Newest"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
      >
        {currentLabel}
        <ChevronDown
          size={13}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[130px] overflow-hidden rounded-xl border border-border bg-white shadow-md">
          {OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => select(value)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 font-sans text-sm transition-colors hover:bg-foreground/4"
            >
              <span className={current === value ? "text-core-black font-medium" : "text-foreground/60"}>
                {label}
              </span>
              {current === value && <Check size={13} className="text-core-black" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
