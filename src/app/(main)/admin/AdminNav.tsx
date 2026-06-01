"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Video, MessageSquare, Users, Radio, FileText } from "lucide-react"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/channels", label: "Channels", icon: Radio },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/threads", label: "Threads", icon: FileText },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-sans text-sm transition-colors ${
              active
                ? "bg-core-black text-white"
                : "text-foreground/60 hover:text-core-black hover:bg-foreground/5"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
