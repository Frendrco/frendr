"use client"

import { useEffect, useRef, useState } from "react"

const HEADER_H = 64 // matches top-16

export function StickyPlayer({ children }: { children: React.ReactNode }) {
  const markerRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return

    // Capture natural document offset once — never changes, no feedback loop
    const threshold = marker.getBoundingClientRect().top + window.scrollY - HEADER_H

    function check() {
      setIsStuck(window.scrollY >= threshold)
    }

    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  return (
    <>
      <div ref={markerRef} className="h-px" />
      <div
        className="bg-core-black w-full sticky top-16 z-40 overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: isStuck ? "33vh" : "60vh" }}
      >
        {children}
      </div>
    </>
  )
}
