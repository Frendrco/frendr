"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

type NotifFromUser = { displayName: string; username: string; avatarUrl?: string | null }
type Notification = {
  id: string
  type: string
  fromUser?: NotifFromUser | null
  contentId?: string | null
  read: boolean
  createdAt: string
}

function notifMessage(n: Notification) {
  const name = n.fromUser?.displayName ?? "Someone"
  switch (n.type) {
    case "follow":  return `${name} started following you`
    case "comment": return `${name} commented on your post`
    case "reply":   return `${name} replied to your comment`
    case "message": return `${name} sent you a message`
    case "vote":    return `${name} liked your content`
    default:        return `New notification from ${name}`
  }
}

function notifUrl(n: Notification) {
  switch (n.type) {
    case "follow":  return n.fromUser?.username ? `/${n.fromUser.username}` : "/"
    case "message": return "/messages"
    default:        return "#"
  }
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return "just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications)
      .finally(() => setLoading(false))

    // Mark all read on page visit
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }, [])

  async function handleClick(n: Notification) {
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    const url = notifUrl(n)
    if (url !== "#") router.push(url)
  }

  async function clearAll() {
    await fetch("/api/notifications", { method: "DELETE" })
    setNotifications([])
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sans font-bold text-2xl text-core-black">Notifications</h1>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors">
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-foreground/30">
            <Bell size={40} strokeWidth={1.5} />
            <p className="font-sans text-base">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex items-start gap-4 w-full rounded-2xl px-4 py-4 text-left transition-colors hover:bg-foreground/5",
                  !n.read && "bg-spring-green/5"
                )}
              >
                <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-foreground/10">
                  {n.fromUser?.avatarUrl ? (
                    <Image src={n.fromUser.avatarUrl} alt={n.fromUser.displayName} width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-sm text-core-black">
                      {n.fromUser?.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-core-black">{notifMessage(n)}</p>
                  <p className="font-sans text-xs text-foreground/40 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>

                {!n.read && <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-spring-green" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
