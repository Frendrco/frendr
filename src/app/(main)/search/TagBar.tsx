"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagBarProps {
  tags: string[]
  activeTag: string
  isSearching: boolean
}

export function TagBar({ tags, activeTag, isSearching }: TagBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateArrows() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      ro.disconnect()
    }
  }, [])

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" })
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white shadow-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex items-center gap-2 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tags.map(t => (
          <Link
            key={t}
            href={t === "All" ? "/search" : `/search?tag=${encodeURIComponent(t)}`}
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-4 h-8 font-sans font-medium text-sm transition-colors",
              !isSearching && activeTag === t
                ? "bg-spring-green text-core-black"
                : "border border-border bg-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30"
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white shadow-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  )
}
