import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { Sparkles } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { FeedGrid, RecessFeedGrid, type FeedItem } from "@/components/feed/FeedGrid"
import type { RecessCardData } from "@/components/common/RecessCard"

const COLOR_MAP: Record<string, string> = {
  "spring-green":   "bg-spring-green/60",
  "winter-green":   "bg-winter-green",
  "bloom-lavender": "bg-bloom-lavender",
  "sky-blue":       "bg-sky-blue",
  "sunny-yellow":   "bg-sunny-yellow",
  "hyper-blue":     "bg-hyper-blue/50",
  "dream-lilac":    "bg-dream-lilac",
}
const FALLBACK_COLORS = Object.values(COLOR_MAP)

const PLACEHOLDER_FRENDS = [
  { name: "Jamie Larson",    username: "jamielarson",    color: "bg-bloom-lavender",  openToWork: true  },
  { name: "Mika Okonkwo",   username: "mikaokonkwo",    color: "bg-sky-blue",         openToWork: false },
  { name: "Teo Brandeis",   username: "teobrandeis",    color: "bg-sunny-yellow",     openToWork: true  },
  { name: "Rena Castillo",  username: "renacastillo",   color: "bg-winter-green",     openToWork: false },
]

export default async function FollowingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!currentUser) redirect("/sign-in")

  const [peopleFollows, channelFollows] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: currentUser.id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            openToWork: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.channelFollow.findMany({
      where: { userId: currentUser.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverUrl: true,
            color: true,
            type: true,
            videos: { take: 1, include: { video: { select: { thumbnailUrl: true } } } },
            _count: { select: { videos: true } },
          },
        },
      },
      orderBy: { followedAt: "desc" },
    }),
  ])

  const people = peopleFollows.map(f => f.following)
  const channels = channelFollows.map(f => f.channel)

  const followingIds = peopleFollows.map(f => f.following.id)
  const followedChannelIds = channelFollows.map(f => f.channel.id)
  const channelNames = Object.fromEntries(channelFollows.map(f => [f.channel.id, f.channel.name]))

  // Fetch videos for feed sections
  let feedVideos: FeedItem[] = []
  let recessVideos: RecessCardData[] = []

  if (followingIds.length > 0 || followedChannelIds.length > 0) {
    const [creatorVideos, channelVideoRows, creatorRecess] = await Promise.all([
      followingIds.length > 0
        ? prisma.video.findMany({
            where: { userId: { in: followingIds }, visibility: "PUBLIC", hideFromFeeds: false, videoType: "PORTFOLIO" },
            orderBy: { createdAt: "desc" },
            take: 80,
            include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
          })
        : Promise.resolve([]),
      followedChannelIds.length > 0
        ? prisma.channelVideo.findMany({
            where: { channelId: { in: followedChannelIds } },
            orderBy: { addedAt: "desc" },
            take: 80,
            include: {
              video: {
                include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
              },
            },
          })
        : Promise.resolve([]),
      followingIds.length > 0
        ? prisma.video.findMany({
            where: { userId: { in: followingIds }, visibility: "PUBLIC", hideFromFeeds: false, videoType: "RECESS" },
            orderBy: { createdAt: "desc" },
            take: 40,
            include: {
              user: { select: { username: true, displayName: true, avatarUrl: true } },
              _count: { select: { likes: true } },
            },
          })
        : Promise.resolve([]),
    ])

    const allItems: { item: FeedItem; date: Date }[] = [
      ...creatorVideos.map(v => ({ item: v as FeedItem, date: v.createdAt })),
      ...channelVideoRows
        .filter(cv => cv.video.visibility === "PUBLIC" && !cv.video.hideFromFeeds && cv.video.videoType === "PORTFOLIO")
        .map(cv => ({
          item: { ...cv.video, sourceLabel: `From ${channelNames[cv.channelId] ?? "a channel"}` } as FeedItem,
          date: cv.addedAt,
        })),
    ]
    allItems.sort((a, b) => b.date.getTime() - a.date.getTime())

    const seen = new Set<string>()
    for (const { item } of allItems) {
      if (!seen.has(item.id)) { seen.add(item.id); feedVideos.push(item) }
    }

    recessVideos = creatorRecess.map(v => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      streamId: v.streamId,
      externalUrl: v.externalUrl,
      tags: v.tags,
      categories: v.categories,
      likeCount: v._count.likes,
      user: v.user,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <div className="mb-10 text-center md:text-left">
          <h1 className="font-sans font-bold text-2xl text-core-black">Following</h1>
          <p className="mt-1 font-sans text-sm text-foreground/40">Creators and channels you follow</p>
        </div>

        <div className="flex flex-col gap-14">

            {/* ── For You ──────────────────────────────────── */}
            <section>
              <h2 className="mb-6 font-sans font-semibold text-base text-core-black">
                Latest
                {feedVideos.length > 0 && (
                  <span className="ml-2 font-normal text-foreground/30">{feedVideos.length}</span>
                )}
              </h2>
              {feedVideos.length === 0 ? (
                <div className="rounded-xl bg-[#FAF8F6] px-6 py-8 text-center">
                  <p className="font-sans text-sm text-foreground/50">
                    Follow creators and channels to see their videos here
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link
                      href="/"
                      className="inline-flex h-8 items-center rounded-full bg-spring-green px-5 font-sans font-medium text-xs text-core-black transition-colors hover:bg-spring-green/90"
                    >
                      Discover creators
                    </Link>
                    <Link
                      href="/channels"
                      className="inline-flex h-8 items-center rounded-full border border-border px-5 font-sans font-medium text-xs text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      Browse channels
                    </Link>
                  </div>
                </div>
              ) : (
                <FeedGrid videos={feedVideos} showTimestamp />
              )}
            </section>

            {/* ── Recess ───────────────────────────────────── */}
            {recessVideos.length > 0 && (
              <section>
                <h2 className="mb-6 font-sans font-semibold text-base text-core-black">
                  Recess
                  <span className="ml-2 font-normal text-foreground/30">{recessVideos.length}</span>
                </h2>
                <RecessFeedGrid videos={recessVideos} />
              </section>
            )}

            {/* ── Frends ───────────────────────────────────── */}
            <section>
              <h2 className="mb-6 font-sans font-semibold text-base text-core-black">
                Frends
                <span className="ml-2 font-normal text-foreground/30">{people.length || PLACEHOLDER_FRENDS.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                {/* Real follows */}
                {people.map(user => (
                  <Link
                    key={user.id}
                    href={`/${user.username}`}
                    className="group flex flex-col items-center gap-2.5 text-center"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted ring-2 ring-transparent group-hover:ring-spring-green transition-all duration-200">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.displayName} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-bloom-lavender" />
                      )}
                    </div>
                      <div>
                        <p className="font-sans font-semibold text-sm text-core-black line-clamp-1">
                          {user.displayName}
                        </p>
                        <p className="font-sans text-xs text-foreground/40">@{user.username}</p>
                        {user.openToWork && (
                          <span className="mt-1.5 inline-flex items-center rounded-full bg-spring-green/20 px-2 py-0.5 font-sans text-[10px] font-medium text-spring-green">
                            Open to work
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}

                {/* Placeholder frends (design preview) */}
                {people.length === 0 && PLACEHOLDER_FRENDS.map(p => (
                  <div key={p.username} className="flex flex-col items-center gap-2.5 text-center opacity-40 pointer-events-none select-none">
                    <div className={`h-16 w-16 rounded-full ${p.color}`} />
                    <div>
                      <p className="font-sans font-semibold text-sm text-core-black">{p.name}</p>
                      <p className="font-sans text-xs text-foreground/40">@{p.username}</p>
                      {p.openToWork && (
                        <span className="mt-1.5 inline-flex items-center rounded-full bg-spring-green/20 px-2 py-0.5 font-sans text-[10px] font-medium text-spring-green">
                          Open to work
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            </section>

            {/* ── Channels ─────────────────────────────────── */}
            {channels.length > 0 && (
              <section>
                <h2 className="mb-6 font-sans font-semibold text-base text-core-black">
                  Channels
                  <span className="ml-2 font-normal text-foreground/30">{channels.length}</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {channels.map((channel, i) => {
                    const cover = channel.coverUrl ?? channel.videos[0]?.video.thumbnailUrl ?? null
                    const colorClass = channel.color
                      ? (COLOR_MAP[channel.color] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
                      : FALLBACK_COLORS[i % FALLBACK_COLORS.length]

                    return (
                      <Link
                        key={channel.id}
                        href={`/channels/${channel.slug}`}
                        className="group flex flex-col gap-3"
                      >
                        <div className="relative overflow-hidden rounded-xl aspect-video">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={channel.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className={`h-full w-full ${colorClass} transition-opacity group-hover:opacity-90`} />
                          )}
                          {channel.type === "admin" && (
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-spring-green px-2.5 py-1">
                              <Sparkles size={9} className="text-core-black" />
                              <span className="font-sans font-medium text-[9px] text-core-black">Frendr Picks</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-sm text-core-black line-clamp-1">
                            {channel.name}
                          </p>
                          <p className="mt-0.5 font-sans text-xs text-foreground/40">
                            {channel._count.videos} {channel._count.videos === 1 ? "video" : "videos"}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
      </div>
    </div>
  )
}
