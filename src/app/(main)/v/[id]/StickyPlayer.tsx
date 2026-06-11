"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function StickyPlayer({ children, title }: { children: React.ReactNode; title: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Sentinel: 1px div just above the sticky bar — goes out of view when player snaps to top */}
      <div ref={sentinelRef} className="h-px" />

      <div className="bg-core-black w-full sticky top-16 z-40 transition-all duration-300">
        {isStuck ? (
          <div className="flex items-center gap-4 px-4 py-2">
            <div className="w-48 shrink-0">{children}</div>
            <p className="font-sans font-medium text-sm text-white/90 truncate">{title}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-screen-xl">{children}</div>
        )}
      </div>
    </>
  )
}
