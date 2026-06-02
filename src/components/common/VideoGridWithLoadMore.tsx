"use client"

import { useState } from "react"
import { VideoCard, type VideoCardData } from "./VideoCard"

interface Props {
  initialVideos: VideoCardData[]
  showTimestamp?: boolean
}

export function VideoGridWithLoadMore({ initialVideos, showTimestamp }: Props) {
  const [visibleCount, setVisibleCount] = useState(16)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {initialVideos.slice(0, visibleCount).map((video) => (
          <VideoCard key={video.id} video={video} showTimestamp={showTimestamp} />
        ))}
      </div>
      {initialVideos.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 8)}
            className="h-10 px-6 rounded-full bg-core-black font-sans font-medium text-sm text-white hover:bg-spring-green hover:text-core-black transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}
