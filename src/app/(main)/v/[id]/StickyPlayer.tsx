"use client"

import { useEffect, useState } from "react"

export function StickyPlayer({ children }: { children: React.ReactNode }) {
  const [isStuck, setIsStuck] = useState(false)

  useEffect(() => {
    function check() {
      setIsStuck(window.scrollY > 80)
    }

    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  return (
    <div
      className="bg-core-black w-full sticky top-16 z-40 overflow-hidden transition-[height] duration-300 ease-in-out"
      style={{ height: isStuck ? "33vh" : "60vh" }}
    >
      {children}
    </div>
  )
}
