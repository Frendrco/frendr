"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Search, ChevronDown } from "lucide-react"
import { VideoCard } from "@/components/common/VideoCard"
import { CONTENT_TAGS } from "@/lib/categories"

type VideoItem = {
  id: string
  slug: string | null
  title: string
  thumbnailUrl: string | null
  streamId: string | null
  externalUrl: string | null
  featured: boolean
  tags: string[]
  categories: string[]
  createdAt: string
  likeCount: number
  user: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

type Sort = "newest" | "trending"

const INITIAL = 24
const PAGE_SIZE = 12

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest",
  trending: "Trending",
}

export function DiscoverGrid({ videos }: { videos: VideoItem[] }) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("newest")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [shown, setShown] = useState(INITIAL)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setShown(INITIAL) }, [sort, activeCategory, query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const availableCategories = useMemo(() => {
    const present = new Set(videos.flatMap((v) => v.categories))
    return CONTENT_TAGS.filter((t) => present.has(t))
  }, [videos])

  const processedVideos = useMemo(() => {
    let v = [...videos]

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      v = v.filter(
        (vid) =>
          vid.title.toLowerCase().includes(q) ||
          vid.user.displayName.toLowerCase().includes(q) ||
          vid.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (activeCategory) {
      v = v.filter((vid) => vid.categories.includes(activeCategory))
    }

    if (sort === "trending") {
      v = [...v].sort((a, b) => b.likeCount - a.likeCount)
    }

    return v
  }, [videos, query, activeCategory, sort])

  const visible = processedVideos.slice(0, shown)
  const hasMore = processedVideos.length > shown

  return (
    <>
      {/* Search input */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, creator, or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 rounded-full border border-border pl-10 pr-4 font-sans text-sm text-core-black placeholder:text-foreground/40 bg-white focus:outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Category pills + sort dropdown */}
      <div className="flex items-center gap-2 mb-5">

        {availableCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide min-w-0 flex-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={
                activeCategory === null
                  ? "inline-flex h-7 shrink-0 items-center rounded-full bg-core-black px-3 font-sans text-xs font-medium text-white"
                  : "inline-flex h-7 shrink-0 items-center rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
              }
            >
              All
            </button>
            {availableCategories.map((cat) => {
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={
                    isActive
                      ? "inline-flex h-7 shrink-0 items-center rounded-full bg-core-black px-3 font-sans text-xs font-medium text-white"
                      : "inline-flex h-7 shrink-0 items-center rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                  }
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative shrink-0 ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            {SORT_LABELS[sort]}
            <ChevronDown size={11} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[120px] overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {(["newest", "trending"] as Sort[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSort(key); setDropdownOpen(false) }}
                  className={`flex w-full items-center px-4 py-2.5 font-sans text-xs font-medium transition-colors hover:bg-mist-grey ${sort === key ? "text-core-black" : "text-foreground/50"}`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result count (search mode only) */}
      {query.trim() && (
        <p className="mb-4 font-sans text-sm text-foreground/40">
          {processedVideos.length} result{processedVideos.length !== 1 ? "s" : ""} for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {/* Grid / empty states */}
      {processedVideos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-semibold text-sm text-core-black">
            {query.trim()
              ? `No results for "${query.trim()}"`
              : activeCategory
              ? `No ${activeCategory} videos yet`
              : "Nothing here yet"}
          </p>
          <p className="font-sans text-sm text-foreground/40">
            {query.trim() ? "Try a different title, creator, or tag." : "Check back soon."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
            {visible.map((v, i) => (
              <VideoCard key={v.id} video={v} showTimestamp priority={i < 4} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShown((n) => n + PAGE_SIZE)}
                className="inline-flex h-10 items-center rounded-full border border-border px-8 font-sans font-medium text-sm text-core-black transition-colors hover:border-core-black"
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
