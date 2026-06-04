"use client"

import { useState } from "react"
import { RecessCard, type RecessCardData } from "@/components/common/RecessCard"

const INITIAL = 20
const PAGE_SIZE = 20

export function RecessGrid({ videos }: { videos: (RecessCardData & { likeCount: number })[] }) {
  const [shown, setShown] = useState(INITIAL)
  const visible = videos.slice(0, shown)
  const hasMore = videos.length > shown

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4">
        {visible.map((v) => (
          <RecessCard key={v.id} video={v} />
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
  )
}
