"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

export function ActivityPing() {
  const { isSignedIn } = useAuth()
  useEffect(() => {
    if (isSignedIn) fetch("/api/users/ping", { method: "POST" })
  }, [isSignedIn])
  return null
}
