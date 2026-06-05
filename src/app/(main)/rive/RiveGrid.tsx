"use client"

import { useState } from "react"
import { RiveCard } from "@/components/common/RiveCard"

type Thread = {
  id:        string
  title:     string
  riveUrls:  string[]
  imageUrls: string[]
  voteCount: number
  createdAt: Date | string
  userId:    string
  user: { username: string; displayName: string; avatarUrl: string | null }
  _count:    { comments: number }
}

type Sort = "recent" | "popular"

export function RiveGrid({ threads, currentUserId }: { threads: Thread[]; currentUserId?: string }) {
  const [sort, setSort] = useState<Sort>("recent")

  const sorted = sort === "popular"
    ? [...threads].sort((a, b) => b.voteCount - a.voteCount)
    : threads

  return (
    <>
      {/* Sort toggle */}
      <div className="mb-6 flex gap-2 justify-center md:justify-start">
        {(["recent", "popular"] as Sort[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={[
              "inline-flex h-9 items-center rounded-full px-5 font-sans text-sm font-medium capitalize transition-colors",
              sort === s
                ? "bg-core-black text-white"
                : "border border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground",
            ].join(" ")}
          >
            {s === "recent" ? "New" : "Popular"}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-medium text-sm text-core-black">No Rive posts yet</p>
          <p className="font-sans text-sm text-foreground/40">Be the first to share interactive work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((t) => (
            <RiveCard
              key={t.id}
              id={t.id}
              title={t.title}
              riveUrl={t.riveUrls[0]}
              previewUrl={t.imageUrls[0] ?? null}
              voteCount={t.voteCount}
              commentCount={t._count.comments}
              user={t.user}
              isOwner={!!currentUserId && currentUserId === t.userId}
            />
          ))}
        </div>
      )}
    </>
  )
}
