"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"

export function MessagesNavItem() {
  const [hasUnread, setHasUnread] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/messages/conversations")
      if (!res.ok) return
      const data = await res.json()
      setHasUnread(data.some((c: { unreadCount: number }) => c.unreadCount > 0))
    }

    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  const showDot = hasUnread && !pathname.startsWith("/messages")

  return (
    <Link
      href="/messages"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-foreground/50 hover:text-foreground transition-colors"
      aria-label="Messages"
    >
      <MessageCircle size={17} />
      {showDot && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </Link>
  )
}
