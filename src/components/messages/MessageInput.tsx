"use client"

import { useRef, useState } from "react"
import { Send, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import data from "@emoji-mart/data"

const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false })

interface Props {
  conversationId: string
  onSent?: (message: { id: string; body: string; createdAt: string; senderId: string; sender: { id: string; username: string; displayName: string; avatarUrl: string | null } }) => void
}

export function MessageInput({ conversationId, onSent }: Props) {
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || sending) return

    setSending(true)
    setBody("")

    const res = await fetch(`/api/messages/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    })

    if (res.ok) {
      const message = await res.json()
      onSent?.(message)
    }

    setSending(false)
    textareaRef.current?.focus({ preventScroll: true })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function onEmojiSelect(emoji: { native: string }) {
    const ta = textareaRef.current
    if (!ta) { setBody((b) => b + emoji.native); setShowPicker(false); return }
    const start = ta.selectionStart ?? body.length
    const end   = ta.selectionEnd   ?? body.length
    const next  = body.slice(0, start) + emoji.native + body.slice(end)
    setBody(next)
    setShowPicker(false)
    // Restore focus + cursor after state update
    requestAnimationFrame(() => {
      ta.focus({ preventScroll: true })
      const pos = start + emoji.native.length
      ta.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="relative flex items-end gap-2 border-t border-border p-4">
      {showPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-50 shadow-lg rounded-xl overflow-hidden">
          <Picker
            data={data}
            onEmojiSelect={onEmojiSelect}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-colors",
          showPicker ? "bg-foreground/10 text-foreground" : "text-foreground/30 hover:text-foreground/60"
        )}
        aria-label="Emoji picker"
      >
        <Smile size={18} />
      </button>

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message…"
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5",
          "font-sans text-base md:text-sm text-foreground placeholder:text-foreground/30",
          "focus:outline-none focus:border-black/20 dark:focus:border-white/20",
          "transition-colors min-h-[42px] max-h-32"
        )}
        style={{ height: "42px" }}
        onInput={(e) => {
          const t = e.currentTarget
          t.style.height = "42px"
          t.style.height = Math.min(t.scrollHeight, 128) + "px"
        }}
      />
      <button
        onClick={handleSend}
        disabled={!body.trim() || sending}
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-colors",
          body.trim() ? "bg-core-black dark:bg-white text-white dark:text-core-black hover:bg-spring-green hover:text-core-black" : "bg-foreground/10 text-foreground/30"
        )}
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </div>
  )
}
