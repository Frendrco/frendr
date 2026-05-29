"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { Settings, Video, ListVideo, LogOut } from "lucide-react"
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
    .map((w) => w[0])
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
      <div className="flex h-full w-full items-center justify-center bg-spring-green font-sans font-bold text-core-black" style={{ fontSize: size * 0.35 }}>
        {initials}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-8 w-8 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2">
        <Avatar size={32} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[200px] w-52 p-1.5"
      >
        {/* Identity block */}
        <div className="flex flex-col items-center gap-2 px-2 py-3">
          <div className="h-10 w-10 overflow-hidden rounded-full">
            <Avatar size={40} />
          </div>
          <span className="font-sans font-semibold text-sm text-core-black">
            {displayName}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2.5 px-2 py-2 font-sans text-sm cursor-pointer"
          onClick={() => router.push("/dashboard/settings")}
        >
          <Settings size={14} className="shrink-0 text-foreground/40" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2.5 px-2 py-2 font-sans text-sm cursor-pointer"
          onClick={() => router.push(`/${username}`)}
        >
          <Video size={14} className="shrink-0 text-foreground/40" />
          My Videos
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2.5 px-2 py-2 font-sans text-sm cursor-pointer"
          onClick={() => router.push(`/${username}/playlists`)}
        >
          <ListVideo size={14} className="shrink-0 text-foreground/40" />
          My Playlists
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="gap-2.5 px-2 py-2 font-sans text-sm cursor-pointer"
          onClick={() => signOut(() => router.push("/"))}
        >
          <LogOut size={14} className="shrink-0" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
