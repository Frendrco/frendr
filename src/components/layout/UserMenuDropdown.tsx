"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { Settings, Tv2, LogOut, Compass, Users, Rss } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
  username: string
  displayName: string
}

export function UserMenuDropdown({ username, displayName }: Props) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  const avatarUrl = user?.imageUrl
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function Avatar({ size }: { size: number }) {
    return avatarUrl ? (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    ) : (
      <div
        className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-core-black"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center h-9 w-9 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur overflow-hidden transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2">
        <Avatar size={36} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-48 p-1">

        {/* Nav — primarily for mobile */}
        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer md:hidden"
          onClick={() => router.push("/search")}
        >
          <span className="font-sans text-sm">Discover</span>
          <Compass size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer md:hidden"
          onClick={() => router.push("/channels")}
        >
          <span className="font-sans text-sm">Channels</span>
          <Tv2 size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer md:hidden"
          onClick={() => router.push("/community")}
        >
          <span className="font-sans text-sm">Community</span>
          <Users size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer md:hidden"
          onClick={() => router.push("/feed")}
        >
          <span className="font-sans text-sm">Following</span>
          <Rss size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>
        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer"
          onClick={() => router.push(username ? `/${username}` : "/onboarding")}
        >
          <span className="font-sans text-sm">View Profile</span>
          <div className="h-5 w-5 overflow-hidden rounded-full">
            <Avatar size={20} />
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer"
          onClick={() => router.push("/dashboard/settings")}
        >
          <span className="font-sans text-sm">Settings</span>
          <Settings size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>

        <DropdownMenuItem
          className="justify-between px-3 py-1.5 cursor-pointer"
          onClick={() => router.push("/dashboard/channels")}
        >
          <span className="font-sans text-sm">My Channels</span>
          <Tv2 size={16} strokeWidth={1.5} className="text-foreground/40" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="justify-between px-3 py-1.5 cursor-pointer"
          onClick={() => signOut(() => router.push("/"))}
        >
          <span className="font-sans text-sm">Log Out</span>
          <LogOut size={16} strokeWidth={1.5} />
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
