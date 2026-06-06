"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // If running as installed PWA, record it permanently and never show banner
    if (window.matchMedia("(display-mode: standalone)").matches) {
      localStorage.setItem("pwa-installed", "1")
      return
    }

    // Don't show if already dismissed or previously launched as installed PWA
    if (
      localStorage.getItem("install-banner-dismissed") ||
      localStorage.getItem("pwa-installed")
    ) return

    // Only show after 2+ dashboard visits
    const visits = parseInt(localStorage.getItem("dashboard-visits") ?? "0", 10) + 1
    localStorage.setItem("dashboard-visits", String(visits))
    if (visits >= 2) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem("install-banner-dismissed", "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-spring-green px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="font-sans text-sm text-core-black">
        Frendr works better as an app. No browser, faster, notifications that actually reach you.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/download"
          className="inline-flex h-7 items-center px-4 rounded-full bg-core-black text-white font-sans font-medium text-xs transition-transform hover:scale-105"
        >
          Get the app
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-core-black/50 hover:text-core-black transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
