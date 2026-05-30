import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { VideoCard, type VideoCardData } from "@/components/common/VideoCard"

export default async function FeedPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, displayName: true },
  })
  if (!currentUser) redirect("/sign-in")

  // Creator follows
  const follows = await prisma.follow.findMany({
    where: { followerId: currentUser.id },
    select: { followingId: true },
  })
  const followingIds = follows.map(f => f.followingId)

  // Channel follows
  const channelFollows = await prisma.channelFollow.findMany({
    where: { userId: currentUser.id },
    select: { channelId: true, channel: { select: { name: true } } },
  })
  const followedChannelIds = channelFollows.map(f => f.channelId)
  const channelNames = Object.fromEntries(channelFollows.map(f => [f.channelId, f.channel.name]))

  const isEmpty = followingIds.length === 0 && followedChannelIds.length === 0

  // Fetch creator videos
  const creatorVideos = followingIds.length > 0
    ? await prisma.video.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: 60,
        include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
      })
    : []

  // Fetch channel videos
  const channelVideoRows = followedChannelIds.length > 0
    ? await prisma.channelVideo.findMany({
        where: { channelId: { in: followedChannelIds } },
        orderBy: { addedAt: "desc" },
        take: 60,
        include: {
          video: {
            include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
          },
        },
      })
    : []

  // Merge, dedupe by videoId, sort by date
  type FeedItem = VideoCardData & { sourceLabel?: string }

  const seen = new Set<string>()
  const merged: FeedItem[] = []

  // Label helper
  const fromChannel = (channelId: string) => `From ${channelNames[channelId] ?? "a channel"}`

  // Interleave by date
  const allItems: { item: FeedItem; date: Date }[] = [
    ...creatorVideos.map(v => ({ item: v as FeedItem, date: v.createdAt })),
    ...channelVideoRows.map(cv => ({
      item: { ...cv.video, sourceLabel: fromChannel(cv.channelId) } as FeedItem,
      date: cv.addedAt,
    })),
  ]

  allItems.sort((a, b) => b.date.getTime() - a.date.getTime())

  for (const { item } of allItems) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      merged.push(item)
    }
  }

  const hasContent = merged.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl text-core-black">Your Feed</h1>
          {!isEmpty && (
            <p className="mt-1 font-sans text-sm text-foreground/40">
              Latest from creators and channels you follow
            </p>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-spring-green/20">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <p className="font-sans font-semibold text-base text-core-black">Your feed is empty</p>
              <p className="mt-1 font-sans text-sm text-foreground/40">
                Follow creators or channels to see their work here
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-full bg-spring-green px-6 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90"
              >
                Discover Creators
              </Link>
              <Link
                href="/channels"
                className="inline-flex h-9 items-center rounded-full border border-border px-6 font-sans font-medium text-sm text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Browse Channels
              </Link>
            </div>
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center gap-3 py-32 text-center">
            <p className="font-sans font-semibold text-base text-core-black">Nothing posted yet</p>
            <p className="font-sans text-sm text-foreground/40">
              The creators and channels you follow haven&apos;t posted any videos yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {merged.map(video => (
              <div key={video.id} className="flex flex-col gap-1">
                <VideoCard video={video} showTimestamp />
                {video.sourceLabel && (
                  <p className="font-sans text-[10px] text-foreground/30 pl-8">{video.sourceLabel}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
