"use client"

import { useEffect, useRef, useState } from "react"

// Hysteresis: stick only after scrolling past STICK_AT, unstick only after
// scrolling back above UNSTICK_AT. The gap between the two prevents jitter
// when the user stops scrolling near the transition point.
const STICK_AT   = 100
const UNSTICK_AT = 40

export function StickyPlayer({ children }: { children: React.ReactNode }) {
  const [isStuck, setIsStuck] = useState(false)
  const stuckRef = useRef(false)

  useEffect(() => {
    function check() {
      const y = window.scrollY
      const next = stuckRef.current ? y > UNSTICK_AT : y > STICK_AT
      if (next !== stuckRef.current) {
        stuckRef.current = next
        setIsStuck(next)
      }
    }

    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  return (
    // Placeholder always holds 66vh so the page never reflows when the
    // sticky inner div shrinks to 36vh.
    <div style={{ height: "66vh" }}>
      <div
        className="bg-core-black w-full sticky top-16 z-40 overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: isStuck ? "36vh" : "66vh" }}
      >
        {children}
      </div>
    </div>
  )
}
