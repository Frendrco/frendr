"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Search, Bell, MessageCircle, Menu } from "lucide-react"

import { Logo } from "@/components/common/Logo"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Discover", href: "/search", requiresAuth: false },
  { label: "Community", href: "/community", requiresAuth: false },
  { label: "Following", href: "/feed", requiresAuth: true },
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
  const isHome = pathname === "/"
  return (
    <header className={cn("sticky top-0 z-50 w-full", isHome ? "bg-transparent" : "bg-white")}>
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4 md:px-6">

        {/* ── Left: Symbol pill + Nav pill ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Symbol — standalone circle pill */}
          <Link
            href="/"
            className="flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur"
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
        <Link
          href="/search"
          className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur h-10 px-4 text-sm text-foreground/40 hover:text-foreground/60 hover:border-black/20 dark:hover:border-white/20 transition-colors"
        >
          <Search size={15} className="shrink-0" />
          <span className="font-sans font-medium">Search creators…</span>
        </Link>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2 shrink-0">

          {isSignedIn ? (
            <>
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

              {/* User avatar */}
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

          {/* ── Mobile menu ── */}
          <Sheet>
            <SheetTrigger
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col gap-0 p-0">

              {/* Sheet header */}
              <div className="flex items-center border-b border-border px-6 py-4">
                <Logo variant="wordmark" height={24} colour="auto" />
              </div>

              {/* Sheet nav links */}
              <nav className="flex flex-col gap-1 px-4 py-4">
                {NAV_LINKS.map((link) => {
                  if (link.requiresAuth && !isSignedIn) return null
                  return (
                    <SheetClose key={link.href}>
                      <Link
                        href={link.href}
                        className="flex h-10 w-full items-center rounded-lg px-3 font-sans font-medium text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  )
                })}
                <SheetClose>
                  <Link
                    href="/search"
                    className="flex h-10 w-full items-center gap-2 rounded-lg px-3 font-sans font-medium text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Search size={16} />
                    Search
                  </Link>
                </SheetClose>
              </nav>

              {/* Sheet auth */}
              <div className="mt-auto border-t border-border px-4 py-4 flex flex-col gap-2">
                {isSignedIn ? (
                  <>
                    <SheetClose>
                      <Link
                        href="/messages"
                        className="flex h-10 w-full items-center gap-3 rounded-lg px-3 font-sans font-medium text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <MessageCircle size={16} />
                        Messages
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link
                        href="/notifications"
                        className="flex h-10 w-full items-center gap-3 rounded-lg px-3 font-sans font-medium text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Bell size={16} />
                        Notifications
                      </Link>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose>
                      <Link
                        href="/sign-up"
                        className="flex h-10 w-full items-center justify-center rounded-full bg-core-black text-white font-sans font-medium text-sm transition-colors hover:bg-core-black/80"
                      >
                        Sign up
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link
                        href="/sign-in"
                        className="flex h-10 w-full items-center justify-center rounded-full border border-border font-sans font-medium text-sm transition-colors hover:bg-muted"
                      >
                        Login
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
