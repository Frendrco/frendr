import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Sparkles, Globe, Lock } from "lucide-react"
import { CreateAdminChannelForm } from "./CreateAdminChannelForm"
import { AdminDeleteButton } from "../AdminDeleteButton"

export default async function AdminChannelsPage() {
  await requireAdminPage()

  const [adminChannels, userChannels] = await Promise.all([
    prisma.channel.findMany({
      where: { type: "admin" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { videos: true, followers: true } } },
    }),
    prisma.channel.findMany({
      where: { type: { not: "admin" } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { username: true } },
        _count: { select: { videos: true, followers: true } },
      },
    }),
  ])

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-core-black mb-1">Channels</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">Manage official Frendr channels and moderate user-created channels</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

        {/* Left: all channels sections */}
        <div className="flex flex-col gap-8">

          {/* User channels moderation */}
          <section>
            <h2 className="font-sans font-semibold text-sm text-core-black mb-3">
              User Channels <span className="font-normal text-foreground/40">({userChannels.length})</span>
            </h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Channel</th>
                    <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Owner</th>
                    <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">Stats</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {userChannels.map((ch) => (
                    <tr key={ch.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ch.isPublic ? <Globe size={11} className="text-foreground/30 shrink-0" /> : <Lock size={11} className="text-foreground/30 shrink-0" />}
                          <Link
                            href={`/channels/${ch.slug}`}
                            className="font-sans text-sm text-core-black hover:underline line-clamp-1"
                          >
                            {ch.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {ch.user && (
                          <Link
                            href={`/${ch.user.username}`}
                            className="font-sans text-sm text-foreground/70 hover:text-core-black transition-colors"
                          >
                            @{ch.user.username}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-sans text-xs text-foreground/50">
                          {ch._count.videos} videos · {ch._count.followers} followers
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminDeleteButton endpoint={`/api/admin/channels/${ch.id}`} label={`"${ch.name}"`} />
                      </td>
                    </tr>
                  ))}
                  {userChannels.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center font-sans text-sm text-foreground/40">No user channels yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Frendr official channels */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-spring-green" />
              <h2 className="font-sans font-semibold text-sm text-core-black">
                Frendr Channels <span className="font-normal text-foreground/40">({adminChannels.length})</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {adminChannels.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
                  <p className="font-sans font-semibold text-sm text-core-black">No admin channels yet</p>
                  <p className="font-sans text-xs text-foreground/40">Create a Frendr Picks channel using the form</p>
                </div>
              ) : (
                adminChannels.map((ch) => (
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
                        {ch._count.videos} videos · {ch._count.followers} followers
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/channels/${ch.slug}`}
                        className="inline-flex h-8 items-center rounded-full border border-border px-3 font-sans text-xs text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
                      >
                        Manage
                      </Link>
                      <AdminDeleteButton endpoint={`/api/admin/channels/${ch.id}`} label={`"${ch.name}"`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Create form */}
        <div className="rounded-2xl border border-border bg-white p-5 h-fit">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={12} className="text-spring-green" />
            <h2 className="font-sans font-semibold text-sm text-core-black">Create Frendr Channel</h2>
          </div>
          <CreateAdminChannelForm />
        </div>

      </div>
    </div>
  )
}
