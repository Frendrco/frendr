"use client"

import { useState } from "react"
import { VideoCard, type VideoCardData } from "./VideoCard"

interface Props {
  initialVideos: VideoCardData[]
  showTimestamp?: boolean
}

const INITIAL = 24
const PAGE_SIZE = 12

export function VideoGridWithLoadMore({ initialVideos, showTimestamp }: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {initialVideos.slice(0, visibleCount).map((video) => (
          <VideoCard key={video.id} video={video} showTimestamp={showTimestamp} />
        ))}
      </div>
      {initialVideos.length > visibleCount && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="inline-flex h-10 items-center rounded-full border border-border px-8 font-sans font-medium text-sm text-core-black transition-colors hover:border-core-black"
          >
            Show more
          </button>
        </div>
      )}
    </>
  )
}
