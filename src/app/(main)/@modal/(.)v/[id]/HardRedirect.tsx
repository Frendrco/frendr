"use client"

import { useEffect } from "react"

export function HardRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.href = href
  }, [href])
  return null
}
