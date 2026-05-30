"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const BASE_TABS = [
  { label: "Discussions", href: "/community" },
  { label: "Jobs",        href: "/community/jobs" },
]

type Props = { isSignedIn?: boolean }

export function CommunityNav({ isSignedIn = false }: Props) {
  const pathname = usePathname()

  const tabs = isSignedIn
    ? [...BASE_TABS, { label: "Saved", href: "/community/saved" }]
    : BASE_TABS

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map(({ label, href }) => {
        const active =
          href === "/community"
            ? pathname === "/community" ||
              (pathname.startsWith("/community/") &&
                !pathname.startsWith("/community/jobs") &&
                !pathname.startsWith("/community/saved"))
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pb-4 font-sans font-medium text-base border-b-2 -mb-px transition-colors mr-8",
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
