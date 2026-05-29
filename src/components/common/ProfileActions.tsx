"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  isOwn: boolean
  openToWork: boolean
}

export function ProfileActions({ isOwn, openToWork: initial }: Props) {
  const { signOut } = useClerk()
  const router = useRouter()
  const [openToWork, setOpenToWork] = useState(initial)
  const [toggling, setToggling] = useState(false)

  async function toggleOpenToWork() {
    setToggling(true)
    setOpenToWork((v) => !v)
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openToWork: !openToWork }),
    })
    setToggling(false)
  }

  if (!isOwn) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Open to work toggle */}
      <button
        onClick={toggleOpenToWork}
        disabled={toggling}
        className="flex items-center gap-2.5 font-sans text-sm text-foreground/70 hover:text-foreground transition-colors"
      >
        <div className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          openToWork ? "bg-spring-green" : "bg-border"
        )}>
          <div className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            openToWork ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
        Open to work
      </button>

      {/* Edit Profile */}
      <Link
        href="/dashboard/settings"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border font-sans font-medium text-sm text-core-black hover:bg-foreground/5 transition-colors"
      >
        <Pencil size={12} />
        Edit Profile
      </Link>

      {/* Sign out */}
      <button
        onClick={() => signOut(() => router.push("/"))}
        className="inline-flex h-9 items-center justify-center gap-1.5 font-sans font-medium text-sm text-red-500 hover:opacity-70 transition-opacity"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  )
}
