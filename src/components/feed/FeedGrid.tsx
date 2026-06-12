"use client"

import { useState } from "react"
import { VideoCard, type VideoCardData } from "@/components/common/VideoCard"
import { RecessCard, type RecessCardData } from "@/components/common/RecessCard"

export type FeedItem = VideoCardData & { sourceLabel?: string }

interface FeedGridProps {
  videos: FeedItem[]
  showTimestamp?: boolean
}

interface RecessGridProps {
  videos: RecessCardData[]
}

export function FeedGrid({ videos, showTimestamp }: FeedGridProps) {
  const [visibleCount, setVisibleCount] = useState(16)
  const visible = videos.slice(0, visibleCount)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(video => (
          <div key={video.id} className="flex flex-col gap-1">
            <VideoCard video={video} showTimestamp={showTimestamp} />
            <p className={`font-sans text-[10px] text-foreground/30 pl-8 ${!video.sourceLabel ? "invisible" : ""}`}>
              {video.sourceLabel ?? "​"}
            </p>
          </div>
        ))}
      </div>
      {videos.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 12)}
            className="h-10 px-6 rounded-full bg-core-black dark:bg-spring-green font-sans font-medium text-sm text-white dark:text-core-black hover:bg-spring-green hover:text-core-black dark:hover:bg-spring-green/80 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}

export function RecessFeedGrid({ videos }: RecessGridProps) {
  const [visibleCount, setVisibleCount] = useState(8)
  const visible = videos.slice(0, visibleCount)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(video => (
          <RecessCard key={video.id} video={video} />
        ))}
      </div>
      {videos.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 8)}
            className="h-10 px-6 rounded-full bg-core-black dark:bg-spring-green font-sans font-medium text-sm text-white dark:text-core-black hover:bg-spring-green hover:text-core-black dark:hover:bg-spring-green/80 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}
