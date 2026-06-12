"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { Settings, Tv2, LogOut, Compass, Users, Rss, Upload, X, Video } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/common/Logo"

interface Props {
  username: string
  displayName: string
  avatarUrl?: string
}

export function UserMenuDropdown({ username, displayName, avatarUrl }: Props) {
  const { signOut } = useClerk()
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* ── Mobile full-screen overlay ── */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 h-16 shrink-0">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-white/10 bg-background hover:bg-spring-green hover:border-spring-green transition-colors"
            >
              <Logo variant="symbol" height={22} colour="auto" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
          </div>

          {/* Nav links — centered */}
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            {[
              { label: "Discover",  href: "/search" },
              { label: "Channels",  href: "/channels" },
              { label: "Community", href: "/community" },
              { label: "Following", href: "/feed" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-sans font-medium text-2xl text-foreground py-3 hover:text-spring-green transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom: profile + logout */}
          <div className="px-6 pb-12 flex flex-col gap-3">
            {/* Upload CTA */}
            <Link
              href="/dashboard/upload"
              onClick={() => setOpen(false)}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black hover:bg-spring-green/90 transition-colors"
            >
              <Upload size={14} />
              Upload
            </Link>

            <div className="border-t border-black/10 dark:border-white/10 mt-1" />

            <button
              onClick={() => navigate(username ? `/${username}` : "/onboarding")}
              className="w-full h-11 inline-flex items-center justify-between rounded-full border border-black/20 dark:border-white/20 font-sans font-medium text-sm text-foreground px-5 hover:border-black/40 dark:hover:border-white/40 transition-colors"
            >
              <span>View Profile</span>
              <div className="h-5 w-5 overflow-hidden rounded-full shrink-0">
                <Avatar size={20} />
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="w-full h-11 inline-flex items-center justify-between rounded-full border border-black/20 dark:border-white/20 font-sans font-medium text-sm text-foreground px-5 hover:border-black/40 dark:hover:border-white/40 transition-colors"
            >
              <span>Settings</span>
              <Settings size={16} strokeWidth={1.5} className="text-foreground/40" />
            </button>

            <button
              onClick={() => navigate("/dashboard/videos")}
              className="w-full h-11 inline-flex items-center justify-between rounded-full border border-black/20 dark:border-white/20 font-sans font-medium text-sm text-foreground px-5 hover:border-black/40 dark:hover:border-white/40 transition-colors"
            >
              <span>My Videos</span>
              <Video size={16} strokeWidth={1.5} className="text-foreground/40" />
            </button>

            <button
              onClick={() => navigate("/dashboard/channels")}
              className="w-full h-11 inline-flex items-center justify-between rounded-full border border-black/20 dark:border-white/20 font-sans font-medium text-sm text-foreground px-5 hover:border-black/40 dark:hover:border-white/40 transition-colors"
            >
              <span>My Channels</span>
              <Tv2 size={16} strokeWidth={1.5} className="text-foreground/40" />
            </button>

            <div className="border-t border-black/10 dark:border-white/10 mt-1" />

            <button
              onClick={() => signOut(() => router.push("/"))}
              className="w-full h-11 inline-flex items-center justify-center rounded-full bg-red-50 font-sans font-medium text-sm text-red-500 hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>

        </div>
      )}

      {/* ── Mobile avatar trigger (no dropdown) ── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur overflow-hidden transition-colors hover:bg-accent"
        aria-label="Open menu"
      >
        <Avatar size={36} />
      </button>

      {/* ── Desktop dropdown (unchanged) ── */}
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden md:flex items-center justify-center h-9 w-9 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur overflow-hidden transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2">
          <Avatar size={36} />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-48 p-1">

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
            onClick={() => router.push("/dashboard/videos")}
          >
            <span className="font-sans text-sm">My Videos</span>
            <Video size={16} strokeWidth={1.5} className="text-foreground/40" />
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
    </>
  )
}
