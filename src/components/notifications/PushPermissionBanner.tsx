"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushPermissionBanner() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      Notification.permission !== "default" ||
      localStorage.getItem("push_declined") === "1"
    ) return
    setShow(true)
  }, [])

  if (!show) return null

  async function enable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        localStorage.setItem("push_declined", "1")
        setShow(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })

      setShow(false)
    } catch {
      setShow(false)
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    localStorage.setItem("push_declined", "1")
    setShow(false)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
      <Bell className="h-4 w-4 shrink-0 text-spring-green" />
      <span className="flex-1 font-sans text-foreground/80">
        Enable notifications to get alerts when someone messages you.
      </span>
      <button
        onClick={enable}
        disabled={loading}
        className="shrink-0 rounded-full bg-spring-green px-3 py-1 font-sans font-medium text-xs text-core-black transition-colors hover:bg-spring-green/90 disabled:opacity-60"
      >
        {loading ? "Enabling…" : "Enable"}
      </button>
      <button onClick={dismiss} className="shrink-0 text-foreground/40 hover:text-foreground/70">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
