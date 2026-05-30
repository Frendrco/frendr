import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Sparkles, Globe, Lock } from "lucide-react"
import { CreateAdminChannelForm } from "./CreateAdminChannelForm"

export default async function AdminChannelsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!user || user.role !== "admin") redirect("/")

  const channels = await prisma.channel.findMany({
    where: { type: "admin" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true, followers: true } } },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-spring-green px-3 py-1">
          <Sparkles size={11} className="text-core-black" />
          <span className="font-sans font-medium text-xs text-core-black">Admin</span>
        </div>

        <div className="mb-8 mt-3">
          <h1 className="font-sans font-bold text-2xl text-core-black">Frendr Channels</h1>
          <p className="mt-1 font-sans text-sm text-foreground/40">
            Official Frendr curated collections shown prominently across the platform
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* Channel list */}
          <div className="flex flex-col gap-3">
            {channels.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="font-sans font-semibold text-sm text-core-black">No admin channels yet</p>
                <p className="font-sans text-xs text-foreground/40">Create a Frendr Picks channel to feature curated work</p>
              </div>
            ) : (
              channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-spring-green" />
                      <p className="font-sans font-semibold text-sm text-core-black">{ch.name}</p>
                      {ch.isPublic ? (
                        <Globe size={11} className="text-foreground/30" />
                      ) : (
                        <Lock size={11} className="text-foreground/30" />
                      )}
                    </div>
                    <p className="font-sans text-xs text-foreground/40">
                      {ch._count.videos} {ch._count.videos === 1 ? "video" : "videos"} · {ch._count.followers} {ch._count.followers === 1 ? "follower" : "followers"}
                    </p>
                  </div>
                  <Link
                    href={`/channels/${ch.slug}`}
                    className="inline-flex h-8 items-center rounded-full border border-border px-3 font-sans text-xs text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Create form */}
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-4 font-sans font-semibold text-sm text-core-black">Create Admin Channel</h2>
            <CreateAdminChannelForm />
          </div>

        </div>
      </div>
    </div>
  )
}
