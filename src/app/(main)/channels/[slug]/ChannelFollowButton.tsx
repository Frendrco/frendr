"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

type Props = {
  channelId: string
  initialFollowing: boolean
  followerCount: number
}

export function ChannelFollowButton({ channelId, initialFollowing, followerCount }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(followerCount)
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!isSignedIn) { router.push("/sign-in"); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/channels/${channelId}/follow`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following)
        setCount((c) => data.following ? c + 1 : c - 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex h-9 items-center rounded-full px-5 font-sans font-medium text-sm transition-colors disabled:opacity-50 ${
        following
          ? hovered
            ? "bg-red-50 text-red-500 border border-red-200"
            : "bg-foreground/8 text-foreground/70 border border-border"
          : "bg-core-black text-white hover:bg-core-black/80"
      }`}
    >
      {following ? (hovered ? "Unfollow" : "Following") : "Follow"}
      {count > 0 && (
        <span className="ml-2 font-normal text-[11px] opacity-60">{count}</span>
      )}
    </button>
  )
}
