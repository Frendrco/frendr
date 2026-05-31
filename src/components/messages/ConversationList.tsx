"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

interface ConversationSummary {
  id: string
  updatedAt: string
  other: { id: string; username: string; displayName: string; avatarUrl: string | null } | null
  lastMessage: { body: string; createdAt: string } | null
  unreadCount: number
}

interface Props {
  initial: ConversationSummary[]
  activeId?: string
}

export function ConversationList({ initial, activeId }: Props) {
  const [conversations, setConversations] = useState(initial)

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch("/api/messages/conversations")
      if (res.ok) setConversations(await res.json())
    }, 5000)
    return () => clearInterval(id)
  }, [])

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="font-sans text-sm text-foreground/40">No messages yet</p>
        <p className="font-sans text-xs text-foreground/30 mt-1">Start a conversation from someone's profile</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((c) => {
        const isActive = c.id === activeId
        const initials = c.other?.displayName
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() ?? "?"

        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3.5 hover:bg-foreground/5 transition-colors",
                isActive && "bg-spring-green/10"
              )}
            >
              {/* Avatar */}
              <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-spring-green flex items-center justify-center ring-1 ring-border">
                {c.other?.avatarUrl ? (
                  <Image src={c.other.avatarUrl} alt={c.other.displayName} width={36} height={36} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-sans font-bold text-xs text-core-black">{initials}</span>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("font-sans text-sm truncate", c.unreadCount > 0 ? "font-semibold text-core-black" : "font-medium text-foreground")}>
                    {c.other?.displayName ?? "Unknown"}
                  </span>
                  {c.updatedAt && (
                    <span className="font-sans text-[10px] text-foreground/40 shrink-0">
                      {timeAgo(c.updatedAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className={cn("font-sans text-xs truncate", c.unreadCount > 0 ? "text-foreground/70" : "text-foreground/40")}>
                    {c.lastMessage?.body ?? "No messages yet"}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-spring-green" />
                  )}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
