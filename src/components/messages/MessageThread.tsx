"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MessageReaction {
  emoji: string
  userId: string
}

export interface MessageData {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null }
  reactions?: MessageReaction[]
}

interface Props {
  messages: MessageData[]
  currentUserId: string
  onDelete?: (messageId: string) => void
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function groupReactions(reactions: MessageReaction[]) {
  const map: Record<string, number> = {}
  for (const r of reactions) {
    map[r.emoji] = (map[r.emoji] ?? 0) + 1
  }
  return Object.entries(map)
}

export function MessageThread({ messages, currentUserId, onDelete, scrollRef }: Props) {
  const prevCountRef = useRef(messages.length)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [reactionPickerId, setReactionPickerId] = useState<string | null>(null)
  // Local reaction state for optimistic updates: messageId → reactions array
  const [localReactions, setLocalReactions] = useState<Record<string, MessageReaction[]>>({})

  function scrollToBottom(smooth = false) {
    const el = scrollRef?.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" })
  }

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      scrollToBottom(true)
      prevCountRef.current = messages.length
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  useEffect(() => {
    scrollToBottom()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync server reactions into local state when messages update
  useEffect(() => {
    setLocalReactions((prev) => {
      const next = { ...prev }
      for (const msg of messages) {
        if (msg.reactions !== undefined) next[msg.id] = msg.reactions
      }
      return next
    })
  }, [messages])

  async function toggleReaction(messageId: string, emoji: string) {
    const current = localReactions[messageId] ?? []
    const alreadyReacted = current.some((r) => r.userId === currentUserId && r.emoji === emoji)

    // Optimistic update
    setLocalReactions((prev) => {
      const cur = prev[messageId] ?? []
      return {
        ...prev,
        [messageId]: alreadyReacted
          ? cur.filter((r) => !(r.userId === currentUserId && r.emoji === emoji))
          : [...cur, { emoji, userId: currentUserId }],
      }
    })

    await fetch(`/api/messages/${messageId}/reactions`, {
      method: alreadyReacted ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    })

    setReactionPickerId(null)
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 h-full">
        <p className="font-sans text-sm text-foreground/40">Say hello!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-4" onClick={() => setReactionPickerId(null)}>
      {messages.map((msg, i) => {
        const isOwn = msg.senderId === currentUserId
        const prev = messages[i - 1]
        const showAvatar = !isOwn && (i === 0 || prev?.senderId !== msg.senderId)
        const initials = msg.sender.displayName
          .split(" ")
          .map((w: string) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
        const reactions = localReactions[msg.id] ?? []
        const grouped = groupReactions(reactions)
        const showReactionPicker = reactionPickerId === msg.id

        return (
          <div
            key={msg.id}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "flex items-end gap-2",
              isOwn ? "flex-row-reverse" : "flex-row",
              i > 0 && prev?.senderId !== msg.senderId ? "mt-3" : "mt-0.5"
            )}
          >
            {!isOwn && (
              <div className={cn("h-7 w-7 shrink-0 rounded-full overflow-hidden bg-spring-green flex items-center justify-center", !showAvatar && "invisible")}>
                {msg.sender.avatarUrl ? (
                  <Image src={msg.sender.avatarUrl} alt={msg.sender.displayName} width={28} height={28} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-sans font-bold text-[10px] text-core-black">{initials}</span>
                )}
              </div>
            )}

            <div className={cn("flex items-end gap-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
                <div className="relative">
                  <div
                    className={cn(
                      "max-w-xs rounded-2xl px-3.5 py-2 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words",
                      isOwn
                        ? "bg-core-black text-white rounded-br-sm"
                        : "bg-foreground/8 text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.body}
                  </div>

                  {/* Reaction picker trigger */}
                  {(hoveredId === msg.id || showReactionPicker) && (
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 z-10",
                      isOwn ? "-left-8" : "-right-8"
                    )}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setReactionPickerId(showReactionPicker ? null : msg.id) }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-foreground/40 hover:text-foreground/70 shadow-sm transition-colors text-xs"
                        aria-label="React to message"
                      >
                        😊
                      </button>
                    </div>
                  )}

                  {/* Quick reaction bar */}
                  {showReactionPicker && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1.5 shadow-md",
                        isOwn ? "right-full mr-10" : "left-full ml-10"
                      )}
                    >
                      {QUICK_REACTIONS.map((emoji) => {
                        const reacted = reactions.some((r) => r.userId === currentUserId && r.emoji === emoji)
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-base transition-colors hover:bg-foreground/8",
                              reacted && "bg-spring-green/20"
                            )}
                          >
                            {emoji}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Reaction badges */}
                {grouped.length > 0 && (
                  <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                    {grouped.map(([emoji, count]) => {
                      const reacted = reactions.some((r) => r.userId === currentUserId && r.emoji === emoji)
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-xs transition-colors",
                            reacted
                              ? "border-spring-green/50 bg-spring-green/15 text-foreground"
                              : "border-border bg-background text-foreground/60 hover:border-foreground/30"
                          )}
                        >
                          {emoji} <span>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <span className="font-sans text-[10px] text-foreground/30 px-1">
                  {fmtTime(msg.createdAt)}
                </span>
              </div>

              {isOwn && onDelete && (
                <button
                  onClick={() => onDelete(msg.id)}
                  className={cn(
                    "mb-5 shrink-0 text-foreground/20 hover:text-red-400 transition-opacity transition-colors",
                    hoveredId === msg.id ? "opacity-100" : "opacity-0"
                  )}
                  aria-label="Delete message"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
