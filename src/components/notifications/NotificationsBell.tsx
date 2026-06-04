"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Megaphone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type NotifFromUser = { displayName: string; username: string; avatarUrl?: string | null }
type Notification = {
  id: string
  type: string
  fromUser?: NotifFromUser | null
  contentId?: string | null
  contentType?: string | null
  message?: string | null
  read: boolean
  createdAt: string
}

function parseCreditRequest(n: Notification): { videoTitle: string; role: string | null; videoId: string; ownerName: string } | null {
  try { return n.message ? JSON.parse(n.message) : null } catch { return null }
}

function notifMessage(n: Notification) {
  if (n.type === "announcement") return n.message ?? "New announcement"
  if (n.type === "credit_request") {
    const data = parseCreditRequest(n)
    const name = data?.ownerName ?? n.fromUser?.displayName ?? "Someone"
    const role = data?.role ? ` as ${data.role}` : ""
    const title = data?.videoTitle ? ` on "${data.videoTitle}"` : ""
    return `${name} wants to credit you${role}${title}`
  }
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
    case "announcement": return "#"
    case "follow":  return n.fromUser?.username ? `/${n.fromUser.username}` : "/"
    case "message": return "/messages"
    case "credit_request": {
      const data = parseCreditRequest(n)
      return data?.videoId ? `/v/${data.videoId}` : "/"
    }
    case "comment":
    case "reply":
    case "vote":
      if (n.contentType === "video"  && n.contentId) return `/v/${n.contentId}`
      if (n.contentType === "thread" && n.contentId) return `/community/${n.contentId}`
      return "/notifications"
    default:        return "/notifications"
  }
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return "just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function playChime() {
  try {
    const ctx = new AudioContext()
    const notes = [1047, 1319] // C6, E6 — a soft ascending two-note chime
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.14
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.start(t)
      osc.stop(t + 0.5)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch { /* audio not available */ }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const panelRef    = useRef<HTMLDivElement>(null)
  const knownIds    = useRef<Set<string>>(new Set())
  const initialised = useRef(false)
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  async function fetchNotifications() {
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const data: Notification[] = await res.json()

    if (initialised.current) {
      const newUnread = data.filter((n) => !n.read && !knownIds.current.has(n.id))
      if (newUnread.length > 0) playChime()
    }

    data.forEach((n) => knownIds.current.add(n.id))
    initialised.current = true
    setNotifications(data)
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function clearAll() {
    await fetch("/api/notifications", { method: "DELETE" })
    setNotifications([])
  }

  async function handleClick(n: Notification) {
    if (n.type === "credit_request") return
    if (!n.read) {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) })
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.type === "announcement") return
    setOpen(false)
    router.push(notifUrl(n))
  }

  async function respondToCredit(n: Notification, action: "accept" | "decline") {
    if (!n.contentId) return
    await fetch(`/api/credit-requests/${n.contentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setNotifications((prev) => prev.filter((x) => x.id !== n.id))
  }

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [open])

  return (
    <div ref={panelRef} className="relative flex">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-foreground/50 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <span className="font-sans font-semibold text-sm text-core-black">Notifications</span>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={clearAll} className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-foreground/40">
                <Bell size={24} />
                <p className="font-sans text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 transition-colors",
                    n.type !== "credit_request" && "hover:bg-foreground/5 cursor-pointer",
                    !n.read && "bg-spring-green/5"
                  )}
                  onClick={n.type !== "credit_request" ? () => handleClick(n) : undefined}
                >
                  {/* Avatar */}
                  <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-foreground/10">
                    {n.type === "announcement" ? (
                      <div className="flex h-full w-full items-center justify-center bg-spring-green">
                        <Megaphone size={14} className="text-core-black" />
                      </div>
                    ) : n.fromUser?.avatarUrl ? (
                      <Image src={n.fromUser.avatarUrl} alt={n.fromUser.displayName} width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-xs text-core-black">
                        {n.fromUser?.displayName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Text + actions */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-core-black leading-snug">{notifMessage(n)}</p>
                    <p className="font-sans text-xs text-foreground/40 mt-0.5">{timeAgo(n.createdAt)}</p>
                    {n.type === "credit_request" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => respondToCredit(n, "accept")}
                          className="inline-flex h-7 items-center rounded-full bg-spring-green px-3 font-sans text-xs font-medium text-core-black transition-colors hover:bg-spring-green/80"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToCredit(n, "decline")}
                          className="inline-flex h-7 items-center rounded-full border border-border px-3 font-sans text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.read && <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-spring-green" />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-black/5 px-4 py-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors"
            >
              See all notifications
            </Link>
          </div>

        </div>
      )}
    </div>
  )
}
