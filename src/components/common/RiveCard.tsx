"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, ChevronUp, MessageSquare } from "lucide-react"

type Props = {
  id:           string
  title:        string
  riveUrl:      string
  voteCount:    number
  commentCount: number
  user: {
    username:    string
    displayName: string
    avatarUrl:   string | null
  }
}

export function RiveCard({ id, title, riveUrl, voteCount, commentCount, user }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-white flex flex-col">
      {/* Iframe / placeholder */}
      <div
        className="relative aspect-[4/3] bg-mist-grey cursor-crosshair"
        onMouseEnter={() => setLoaded(true)}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-core-black/8 transition-transform group-hover:scale-110">
              <Play size={18} className="text-core-black/30 translate-x-0.5" />
            </div>
          </div>
        )}
        {loaded && (
          <iframe
            src={riveUrl}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
          />
        )}
      </div>

      {/* Meta bar */}
      <Link
        href={`/rive/${id}`}
        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-foreground/[0.03] transition-colors"
      >
        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} width={24} height={24} className="h-full w-full object-cover" />
          ) : (
            <span className="font-sans font-bold text-[8px] text-core-black">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-core-black truncate leading-tight">{title}</p>
          <p className="font-sans text-xs text-foreground/40 leading-tight">@{user.username}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <ChevronUp size={12} />{voteCount}
          </span>
          <span className="flex items-center gap-0.5 font-sans text-xs text-foreground/40">
            <MessageSquare size={12} />{commentCount}
          </span>
        </div>
      </Link>
    </div>
  )
}
