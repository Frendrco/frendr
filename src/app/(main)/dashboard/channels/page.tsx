import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Globe, Lock } from "lucide-react"
import { CreateChannelForm } from "./CreateChannelForm"

const COLOR_HEX: Record<string, string> = {
  "spring-green":   "#5CE65C",
  "winter-green":   "#B9FFB2",
  "bloom-lavender": "#EDC1F6",
  "sky-blue":       "#ADD8F6",
  "sunny-yellow":   "#FFDC7C",
  "hyper-blue":     "#619EF1",
  "dream-lilac":    "#DCE0FA",
}

export default async function DashboardChannelsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, displayName: true },
  })
  if (!user) redirect("/sign-in")

  const channels = await prisma.channel.findMany({
    where: { userId: user.id, type: "user" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true, followers: true } } },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div className="text-center md:text-left w-full md:w-auto">
            <h1 className="font-sans font-bold text-2xl text-foreground">Your Channels</h1>
            <p className="mt-1 font-sans text-sm text-foreground/40">
              Curate videos from anywhere on Frendr into themed collections
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* Channel list */}
          <div className="flex flex-col gap-3">
            {channels.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="font-sans font-semibold text-sm text-foreground">No channels yet</p>
                <p className="font-sans text-xs text-foreground/40">Create your first channel to start curating</p>
              </div>
            ) : (
              channels.map((ch) => {
                const accentColor = ch.color ? (COLOR_HEX[ch.color] ?? "#E5E7EB") : "#E5E7EB"
                return (
                <div key={ch.id} className="flex items-center gap-4 rounded-xl border border-border bg-background overflow-hidden">
                  <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: accentColor }} />
                  <div className="min-w-0 flex-1 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-sans font-semibold text-sm text-foreground">{ch.name}</p>
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
                  <div className="flex items-center gap-2 pr-4">
                    <Link
                      href={`/channels/${ch.slug}`}
                      className="inline-flex h-8 items-center rounded-full border border-border px-3 font-sans text-xs text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              )
              })
            )}
          </div>

          {/* Create channel form */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <h2 className="mb-4 font-sans font-semibold text-sm text-foreground">Create a Channel</h2>
            <CreateChannelForm />
          </div>

        </div>
      </div>
    </div>
  )
}
