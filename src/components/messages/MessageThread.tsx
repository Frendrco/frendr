"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MessageData {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null }
}

interface Props {
  messages: MessageData[]
  currentUserId: string
  onDelete?: (messageId: string) => void
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function MessageThread({ messages, currentUserId, onDelete }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(messages.length)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      prevCountRef.current = messages.length
    }
  }, [messages.length])

  // Scroll to bottom on first render
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 h-full">
        <p className="font-sans text-sm text-foreground/40">Say hello!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-4">
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
                <div
                  className={cn(
                    "max-w-xs rounded-2xl px-3.5 py-2 font-sans text-sm leading-relaxed",
                    isOwn
                      ? "bg-core-black text-white rounded-br-sm"
                      : "bg-foreground/8 text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.body}
                </div>
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
      <div ref={bottomRef} />
    </div>
  )
}
