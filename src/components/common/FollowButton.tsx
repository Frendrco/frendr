"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface Props {
  username: string
  initialIsFollowing: boolean
  size?: "sm" | "md"
  className?: string
}

export function FollowButton({ username, initialIsFollowing, size = "md", className }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (loading) return
    setLoading(true)
    setIsFollowing(prev => !prev)
    const res = await fetch(`/api/users/${username}/follow`, { method: "POST" })
    if (!res.ok) setIsFollowing(prev => !prev)
    setLoading(false)
  }

  const label = isFollowing ? (hovered ? "Unfollow" : "Following") : "Follow"

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      className={cn(
        "rounded-full font-sans font-medium transition-all disabled:opacity-50",
        size === "md" ? "h-9 w-full px-6 text-sm" : "h-6 px-3 text-[11px]",
        isFollowing
          ? hovered
            ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-50"
            : "bg-spring-green/15 text-core-black border border-spring-green/40"
          : "bg-spring-green text-core-black hover:bg-spring-green/90",
        className
      )}
    >
      {label}
    </button>
  )
}
