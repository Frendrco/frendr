"use client"

import { useEffect, useRef, useState } from "react"

export function StickyPlayer({ children }: { children: React.ReactNode }) {
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
      <div ref={sentinelRef} className="h-px" />
      <div
        className="bg-core-black w-full sticky top-16 z-40 overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: isStuck ? "33vh" : "60vh" }}
      >
        {children}
      </div>
    </>
  )
}
