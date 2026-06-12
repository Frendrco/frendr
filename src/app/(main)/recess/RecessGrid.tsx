"use client"

import Link from "next/link"
import { useMemo, useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { RecessCard, type RecessCardData } from "@/components/common/RecessCard"
import { TOOL_TAGS } from "@/lib/categories"

type VideoItem = RecessCardData & { likeCount: number; userId: string }
type Sort = "newest" | "trending" | "following"

const INITIAL = 20
const PAGE_SIZE = 20

type Props = {
  videos: VideoItem[]
  followedUserIds: string[]
  isAuthenticated: boolean
}

export function RecessGrid({ videos, followedUserIds, isAuthenticated }: Props) {
  const [sort, setSort] = useState<Sort>("newest")
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [shown, setShown] = useState(INITIAL)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Reset pagination whenever filter or sort changes
  useEffect(() => { setShown(INITIAL) }, [sort, activeTool])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Which tools actually appear in this dataset (preserve TOOL_TAGS order)
  const availableTools = useMemo(() => {
    const present = new Set(videos.flatMap((v) => v.categories))
    return TOOL_TAGS.filter((t) => present.has(t))
  }, [videos])

  const processedVideos = useMemo(() => {
    let v = [...videos]
    if (sort === "trending") {
      v.sort((a, b) => b.likeCount - a.likeCount)
    } else if (sort === "following") {
      const set = new Set(followedUserIds)
      v = v.filter((vid) => set.has(vid.userId))
    }
    if (activeTool) {
      v = v.filter((vid) => vid.categories.includes(activeTool))
    }
    return v
  }, [videos, sort, activeTool, followedUserIds])

  const visible = processedVideos.slice(0, shown)
  const hasMore = processedVideos.length > shown

  const SORT_LABELS: Record<Sort, string> = {
    newest: "Newest",
    trending: "Trending",
    following: "Following",
  }

  function handleSortSelect(key: Sort) {
    setSort(key)
    setDropdownOpen(false)
  }

  return (
    <>
      {/* Tool pills + sort dropdown */}
      <div className="flex items-center gap-2 mb-5">

        {/* Tool filter pills */}
        {availableTools.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide min-w-0 flex-1">
            <button
              onClick={() => setActiveTool(null)}
              className={
                activeTool === null
                  ? "inline-flex h-7 shrink-0 items-center rounded-full bg-core-black px-3 font-sans text-xs font-medium text-white dark:bg-white dark:text-core-black"
                  : "inline-flex h-7 shrink-0 items-center rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
              }
            >
              All
            </button>
            {availableTools.map((tool) => {
              const isActive = activeTool === tool
              return (
                <button
                  key={tool}
                  onClick={() => setActiveTool(isActive ? null : tool)}
                  className={
                    isActive
                      ? "inline-flex h-7 shrink-0 items-center rounded-full bg-core-black px-3 font-sans text-xs font-medium text-white dark:bg-white dark:text-core-black"
                      : "inline-flex h-7 shrink-0 items-center rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                  }
                >
                  {tool}
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
            <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[120px] overflow-hidden rounded-xl border border-border bg-background shadow-lg dark:shadow-black/30">
              {(["newest", "trending"] as Sort[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSortSelect(key)}
                  className={`flex w-full items-center px-4 py-2.5 font-sans text-xs font-medium transition-colors hover:bg-muted ${sort === key ? "text-foreground" : "text-foreground/50"}`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={() => handleSortSelect("following")}
                  className={`flex w-full items-center px-4 py-2.5 font-sans text-xs font-medium transition-colors hover:bg-muted ${sort === "following" ? "text-foreground" : "text-foreground/50"}`}
                >
                  Following
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex w-full items-center px-4 py-2.5 font-sans text-xs font-medium text-foreground/30 hover:bg-muted transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Following
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty state for following with no follows */}
      {sort === "following" && isAuthenticated && followedUserIds.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-semibold text-sm text-foreground">No one to follow yet</p>
          <p className="font-sans text-sm text-foreground/40">Follow some creators to see their Recess posts here.</p>
        </div>
      )}

      {/* Empty state for following + tool filter combo */}
      {sort === "following" && isAuthenticated && followedUserIds.length > 0 && processedVideos.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-semibold text-sm text-foreground">Nothing here yet</p>
          <p className="font-sans text-sm text-foreground/40">The creators you follow haven&rsquo;t posted any Recess videos{activeTool ? ` made with ${activeTool}` : ""} yet.</p>
        </div>
      )}

      {/* Grid */}
      {(sort !== "following" || !isAuthenticated || followedUserIds.length > 0) && (
        <>
          {processedVideos.length === 0 && activeTool ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-sans font-semibold text-sm text-foreground">No {activeTool} posts yet</p>
              <p className="font-sans text-sm text-foreground/40">Be the first to drop something made with {activeTool}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4">
              {visible.map((v) => (
                <RecessCard key={v.id} video={v} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShown((n) => n + PAGE_SIZE)}
                className="inline-flex h-10 items-center rounded-full border border-border px-8 font-sans font-medium text-sm text-foreground transition-colors hover:border-foreground"
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
