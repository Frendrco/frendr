"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Search, Upload, Menu, X } from "lucide-react"

import { Logo } from "@/components/common/Logo"
import { MessagesNavItem } from "@/components/messages/MessagesNavItem"
import { NotificationsBell } from "@/components/notifications/NotificationsBell"
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [mobileMenuOpen])

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
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />

          {!searchActive && (
            <div className="absolute inset-0 flex items-center justify-center text-foreground/40 cursor-text pointer-events-none">
              <span className="font-sans font-medium text-sm">Search creators & videos…</span>
            </div>
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
              "w-full bg-transparent font-sans font-medium text-sm text-foreground focus:outline-none pl-10 pr-4",
              !searchActive && "opacity-0"
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
              <MessagesNavItem />

              {/* Notifications */}
              <NotificationsBell />

              {/* Avatar / user menu */}
              {userMenu}
            </>
          ) : (
            <div ref={mobileMenuRef} className="relative">
              {/* Desktop auth buttons */}
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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 backdrop-blur text-foreground/60 hover:text-foreground transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>

              {/* Mobile dropdown */}
              {mobileMenuOpen && (
                <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                  <div className="flex flex-col p-2">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2.5 font-sans font-medium text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="my-1.5 border-t border-black/5" />
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 font-sans font-medium text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-1 px-3 py-2.5 font-sans font-medium text-sm text-center rounded-xl bg-core-black text-white hover:bg-spring-green hover:text-core-black transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  )
}
