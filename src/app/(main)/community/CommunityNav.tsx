"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Discussions", href: "/community" },
  { label: "Jobs",        href: "/community/jobs" },
]

export function CommunityNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map(({ label, href }) => {
        const active = href === "/community" ? pathname === "/community" || (pathname.startsWith("/community/") && !pathname.startsWith("/community/jobs")) : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pb-3 font-sans font-medium text-sm border-b-2 -mb-px transition-colors mr-6",
              active
                ? "border-core-black text-core-black"
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
