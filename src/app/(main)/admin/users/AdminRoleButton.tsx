"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface Props {
  userId: string
  isAdmin: boolean
  isSelf: boolean
}

export function AdminRoleButton({ userId, isAdmin, isSelf }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (isSelf) {
    return (
      <span className="inline-flex items-center rounded-full bg-spring-green px-2 py-0.5 font-sans text-xs font-medium text-core-black">
        Admin (you)
      </span>
    )
  }

  const toggle = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-medium transition-colors disabled:opacity-50 ${
        isAdmin
          ? "bg-spring-green text-core-black hover:bg-spring-green/70"
          : "bg-muted text-foreground/50 hover:bg-foreground/10"
      }`}
    >
      {loading && <Loader2 size={10} className="animate-spin" />}
      {isAdmin ? "Admin" : "User"}
    </button>
  )
}
