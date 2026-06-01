import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Users, Video, Radio, MessageSquare, FileText, ArrowRight } from "lucide-react"

export default async function AdminOverviewPage() {
  await requireAdminPage()

  const [userCount, videoCount, channelCount, commentCount, threadCount] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.channel.count(),
    prisma.comment.count(),
    prisma.thread.count(),
  ])

  const stats = [
    { label: "Users", value: userCount, icon: Users, href: "/admin/users", color: "bg-dream-lilac" },
    { label: "Videos", value: videoCount, icon: Video, href: "/admin/videos", color: "bg-sky-blue" },
    { label: "Channels", value: channelCount, icon: Radio, href: "/admin/channels", color: "bg-winter-green" },
    { label: "Comments", value: commentCount, icon: MessageSquare, href: "/admin/comments", color: "bg-bloom-lavender" },
    { label: "Threads", value: threadCount, icon: FileText, href: "/admin/threads", color: "bg-sunny-yellow" },
  ]

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-core-black mb-1">Platform Overview</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">Monitor and moderate all content across Frendr</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-border bg-white p-5 hover:border-foreground/20 transition-colors"
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <Icon size={16} className="text-core-black" />
            </div>
            <p className="font-sans font-bold text-3xl text-core-black">{value.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-1">
              <p className="font-sans text-sm text-foreground/50">{label}</p>
              <ArrowRight size={12} className="text-foreground/30 group-hover:text-foreground/60 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
