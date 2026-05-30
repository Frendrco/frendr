import Link from "next/link"
import Image from "next/image"
import { Sparkles, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function ChannelsPage() {
  const channels = await prisma.channel.findMany({
    where: { isPublic: true },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { videos: true, followers: true } },
      videos: {
        take: 1,
        orderBy: { addedAt: "desc" },
        include: { video: { select: { thumbnailUrl: true } } },
      },
    },
  })

  const adminChannels = channels.filter((c) => c.type === "admin")
  const userChannels = channels.filter((c) => c.type === "user")

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="display-sm text-core-black">Channels</h1>
          <p className="mt-2 font-sans text-sm text-foreground/50">
            Curated collections of the best work on Frendr
          </p>
        </div>

        {/* Admin / Frendr Picks channels */}
        {adminChannels.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={14} className="text-spring-green" />
              <h2 className="font-sans font-semibold text-sm text-core-black">Frendr Picks</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminChannels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} featured />
              ))}
            </div>
          </section>
        )}

        {/* User channels */}
        {userChannels.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-2">
              <Users size={14} className="text-foreground/40" />
              <h2 className="font-sans font-semibold text-sm text-core-black">Creator Channels</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {userChannels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </section>
        )}

        {channels.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-32 text-center">
            <p className="font-sans font-semibold text-base text-core-black">No channels yet</p>
            <p className="font-sans text-sm text-foreground/40">
              Channels are curated collections of the best work. Check back soon.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

type ChannelCardData = {
  id: string
  name: string
  slug: string
  description: string | null
  coverUrl: string | null
  type: string
  _count: { videos: number; followers: number }
  videos: { video: { thumbnailUrl: string | null } }[]
}

function ChannelCard({ channel, featured = false }: { channel: ChannelCardData; featured?: boolean }) {
  const cover = channel.coverUrl ?? channel.videos[0]?.video.thumbnailUrl ?? null

  return (
    <Link href={`/channels/${channel.slug}`} className="group flex flex-col gap-3">
      {/* Cover */}
      <div className={`relative overflow-hidden rounded-xl bg-mist-grey ${featured ? "aspect-video" : "aspect-video"}`}>
        {cover ? (
          <Image
            src={cover}
            alt={channel.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-bloom-lavender to-sky-blue" />
        )}
        {channel.type === "admin" && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-spring-green px-2.5 py-1">
            <Sparkles size={9} className="text-core-black" />
            <span className="font-sans font-medium text-[9px] text-core-black">Frendr Picks</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div>
        <p className="font-sans font-semibold text-sm text-core-black leading-snug line-clamp-1">{channel.name}</p>
        {channel.description && (
          <p className="mt-0.5 font-sans text-xs text-foreground/50 line-clamp-1">{channel.description}</p>
        )}
        <p className="mt-1 font-sans text-xs text-foreground/40">
          {channel._count.videos} {channel._count.videos === 1 ? "video" : "videos"}
          {channel._count.followers > 0 && ` · ${channel._count.followers} ${channel._count.followers === 1 ? "follower" : "followers"}`}
        </p>
      </div>
    </Link>
  )
}
