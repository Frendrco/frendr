"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MessageThread, type MessageData } from "@/components/messages/MessageThread"
import { MessageInput } from "@/components/messages/MessageInput"

interface Props {
  conversationId: string
  initialMessages: MessageData[]
  currentUserId: string
  other: { id: string; username: string; displayName: string; avatarUrl: string | null } | null
}

export function ActiveConversation({ conversationId, initialMessages, currentUserId, other }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mark read on mount
  useEffect(() => {
    fetch(`/api/messages/conversations/${conversationId}/read`, { method: "PATCH" })
  }, [conversationId])

  // Poll for new messages
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`)
      if (!res.ok) return
      const data = await res.json()
      const updated: MessageData[] = data.messages.map((m: MessageData & { createdAt: string }) => ({
        ...m,
        createdAt: m.createdAt,
      }))
      setMessages(updated)
      fetch(`/api/messages/conversations/${conversationId}/read`, { method: "PATCH" })
    }, 3000)
    return () => clearInterval(id)
  }, [conversationId])

  function handleSent(message: MessageData) {
    setMessages((prev) => {
      // Avoid duplicates (poll may have already added it)
      if (prev.some((m) => m.id === message.id)) return prev
      return [...prev, message]
    })
  }

  async function handleDelete(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    await fetch(`/api/messages/${messageId}`, { method: "DELETE" })
  }

  const initials = other?.displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?"

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <Link href="/messages" className="md:hidden text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
        </Link>
        {other && (
          <Link href={`/${other.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className={`h-7 w-7 shrink-0 rounded-full overflow-hidden flex items-center justify-center ${other.avatarUrl ? 'bg-muted' : 'bg-spring-green'}`}>
              {other.avatarUrl ? (
                <Image src={other.avatarUrl} alt={other.displayName} width={28} height={28} className="h-full w-full object-cover" />
              ) : (
                <span className="font-sans font-bold text-[10px] text-foreground">{initials}</span>
              )}
            </div>
            <div>
              <p className="font-sans font-semibold text-sm text-foreground leading-tight">{other.displayName}</p>
              <p className="font-sans text-[10px] text-foreground/40">@{other.username}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <MessageThread messages={messages} currentUserId={currentUserId} onDelete={handleDelete} scrollRef={scrollRef} />
      </div>

      {/* Input */}
      <MessageInput conversationId={conversationId} onSent={handleSent} />
    </div>
  )
}
