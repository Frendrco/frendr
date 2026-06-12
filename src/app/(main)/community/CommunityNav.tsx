"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const BASE_TABS = [
  { label: "Discussions", href: "/community" },
  { label: "Jobs",        href: "/community/jobs" },
  { label: "Events",      href: "/community/events" },
  { label: "Marketplace", href: "/community/marketplace" },
]

const NON_DISCUSSION_PREFIXES = ["/community/jobs", "/community/events", "/community/marketplace", "/community/saved"]

type Props = { isSignedIn?: boolean }

export function CommunityNav({ isSignedIn = false }: Props) {
  const pathname = usePathname()

  const tabs = isSignedIn
    ? [...BASE_TABS, { label: "Saved", href: "/community/saved" }]
    : BASE_TABS

  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide">
      {tabs.map(({ label, href }) => {
        const active =
          href === "/community"
            ? pathname === "/community" ||
              (pathname.startsWith("/community/") &&
                !NON_DISCUSSION_PREFIXES.some(p => pathname.startsWith(p)))
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pb-4 font-sans font-medium text-base border-b-2 -mb-px transition-colors mr-5 md:mr-8 whitespace-nowrap shrink-0",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/40 hover:text-foreground/70"
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
