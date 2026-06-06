"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { RecessCard, type RecessCardData } from "@/components/common/RecessCard"
import { TOOL_TAGS } from "@/lib/categories"

type Props = {
  videos: RecessCardData[]
}

export function RecessProfileGrid({ videos }: Props) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(20)

  // Detect which tool tags actually appear in this set of videos
  const presentTools = TOOL_TAGS.filter((tool) =>
    videos.some((v) => v.categories.includes(tool))
  )

  const filtered = activeTool
    ? videos.filter((v) => v.categories.includes(activeTool))
    : videos

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="font-sans font-semibold text-sm text-core-black">No Recess videos yet</p>
        <p className="font-sans text-sm text-foreground/40">
          Short loops, tool tests, and quick explorations will live here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tool filter pills */}
      {presentTools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTool(null)}
            className={cn(
              "h-7 rounded-full px-3 font-sans text-xs font-medium transition-colors",
              activeTool === null
                ? "bg-core-black text-white"
                : "border border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
            )}
          >
            All
          </button>
          {presentTools.map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(activeTool === tool ? null : tool)}
              className={cn(
                "h-7 rounded-full px-3 font-sans text-xs font-medium transition-colors",
                activeTool === tool
                  ? "bg-core-black text-white"
                  : "border border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {tool}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 md:gap-4">
        {filtered.slice(0, visibleCount).map((video) => (
          <RecessCard key={video.id} video={video} />
        ))}
      </div>

      {filtered.length > visibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 20)}
            className="h-10 px-6 rounded-full bg-core-black font-sans font-medium text-sm text-white hover:bg-spring-green hover:text-core-black transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {filtered.length === 0 && activeTool && (
        <p className="py-12 text-center font-sans text-sm text-foreground/40">
          No Recess videos tagged with {activeTool}.
        </p>
      )}
    </div>
  )
}
