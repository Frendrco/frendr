"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Search, Bell, MessageCircle, Upload } from "lucide-react"

import { Logo } from "@/components/common/Logo"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Discover",   href: "/search",    requiresAuth: false },
  { label: "Channels",   href: "/channels",  requiresAuth: false },
  { label: "Community",  href: "/community", requiresAuth: false },
  { label: "Following",  href: "/feed",      requiresAuth: true  },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "font-sans font-medium text-sm transition-colors",
        isActive ? "text-foreground" : "text-foreground/50 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )
}

export function Header({ userMenu }: { userMenu?: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/"

  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchActive = searchFocused || searchQuery.length > 0

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
  }

  return (
    <header className={cn("sticky top-0 z-50 w-full", isHome ? "bg-transparent" : "bg-white")}>
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4 md:px-6">

        {/* ── Left: Symbol pill + Nav pill ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Symbol — standalone circle pill */}
          <Link
            href="/"
            className="flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur hover:bg-spring-green hover:border-spring-green transition-colors duration-200"
          >
            <Logo variant="symbol" height={22} colour="auto" priority />
          </Link>

          {/* Nav links pill */}
          <nav className="hidden md:flex items-center gap-6 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur px-5 h-10">
            {NAV_LINKS.map((link) => {
              if (link.requiresAuth && !isSignedIn) return null
              return <NavLink key={link.href} href={link.href} label={link.label} />
            })}
          </nav>

        </div>

        {/* ── Center: Search pill ── */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex relative flex-1 max-w-xs rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur h-10 hover:border-black/20 dark:hover:border-white/20 transition-colors"
        >
          {!searchActive && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-foreground/40 cursor-text pointer-events-none">
              <Search size={15} className="shrink-0" />
              <span className="font-sans font-medium text-sm">Search creators & videos…</span>
            </div>
          )}

          {searchActive && (
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          )}

          <input
            ref={searchRef}
            name="q"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full bg-transparent font-sans font-medium text-sm text-foreground focus:outline-none transition-all",
              searchActive ? "pl-10 pr-4" : "opacity-0 px-4"
            )}
          />
        </form>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2 shrink-0">

          {isSignedIn ? (
            <>
              {/* Upload */}
              <Link
                href="/dashboard/upload"
                className="hidden md:inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm hover:bg-core-black hover:text-white transition-colors duration-200"
              >
                <Upload size={14} />
                Upload
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-foreground/50 hover:text-foreground transition-colors"
                aria-label="Messages"
              >
                <MessageCircle size={17} />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-foreground/50 hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell size={17} />
              </Link>

              {/* Avatar / user menu */}
              {userMenu}
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/sign-in"
                className="h-9 inline-flex items-center px-4 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur font-sans font-medium text-sm text-foreground hover:border-black/20 dark:hover:border-white/20 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  "rounded-full font-sans font-medium text-sm",
                  "bg-core-black dark:bg-white text-white dark:text-core-black",
                  "hover:bg-spring-green hover:text-core-black",
                  "h-9 inline-flex items-center px-5 transition-colors"
                )}
              >
                Sign up
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  )
}
