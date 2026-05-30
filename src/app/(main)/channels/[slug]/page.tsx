import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, ChevronLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoCard } from "@/components/common/VideoCard"
import { ChannelFollowButton } from "./ChannelFollowButton"
import { AddVideoToChannelButton } from "./AddVideoToChannelButton"
import { ChannelSettings } from "./ChannelSettings"

type Props = { params: Promise<{ slug: string }> }

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params
  const { userId: clerkId } = await auth()

  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, clerkId: true, username: true, displayName: true } },
      _count: { select: { followers: true, videos: true } },
      videos: {
        orderBy: { addedAt: "desc" },
        include: {
          video: {
            include: {
              user: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  })

  if (!channel || (!channel.isPublic && clerkId !== channel.user?.clerkId)) notFound()

  const currentUser = clerkId
    ? await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, role: true },
      })
    : null

  const isFollowing = currentUser
    ? !!(await prisma.channelFollow.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId: currentUser.id } },
      }))
    : false

  const isOwner = currentUser?.id === channel.userId
  const isSiteAdmin = currentUser?.role === "admin"
  const isChannelAdmin = currentUser && !isOwner && !isSiteAdmin
    ? !!(await prisma.channelAdmin.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId: currentUser.id } },
      }))
    : false
  const canManage = isOwner || isSiteAdmin || isChannelAdmin

  const videos = channel.videos.map((cv) => cv.video)

  return (
    <div className="min-h-screen bg-background">

      {/* Cover */}
      {(() => {
        const COLOR_MAP: Record<string, string> = {
          "spring-green":   "bg-spring-green/60",
          "winter-green":   "bg-winter-green",
          "bloom-lavender": "bg-bloom-lavender",
          "sky-blue":       "bg-sky-blue",
          "sunny-yellow":   "bg-sunny-yellow",
          "hyper-blue":     "bg-hyper-blue/50",
          "dream-lilac":    "bg-dream-lilac",
        }
        const colorClass = channel.color ? (COLOR_MAP[channel.color] ?? "bg-bloom-lavender") : "bg-bloom-lavender"
        return (
          <div className={`relative h-48 w-full overflow-hidden md:h-64 ${!channel.coverUrl ? colorClass : ""}`}>
            {channel.coverUrl && (
              <Image src={channel.coverUrl} alt={channel.name} fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )
      })()}

      <div className="mx-auto max-w-screen-xl px-4 md:px-6">

        {/* Back nav */}
        <div className="py-4">
          <Link
            href="/channels"
            className="inline-flex items-center gap-1.5 font-sans text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
            All Channels
          </Link>
        </div>

        {/* Channel header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-sans font-bold text-2xl text-core-black">{channel.name}</h1>
              {channel.type === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-spring-green px-2.5 py-0.5">
                  <Sparkles size={10} className="text-core-black" />
                  <span className="font-sans font-medium text-[10px] text-core-black">Frendr Picks</span>
                </span>
              )}
            </div>
            {channel.description && (
              <p className="font-sans text-sm text-foreground/60 max-w-xl">{channel.description}</p>
            )}
            <p className="mt-2 font-sans text-xs text-foreground/40">
              {channel._count.videos} {channel._count.videos === 1 ? "video" : "videos"}
              {channel._count.followers > 0 && ` · ${channel._count.followers} ${channel._count.followers === 1 ? "follower" : "followers"}`}
              {channel.user && channel.type === "user" && (
                <> · by <Link href={`/${channel.user.username}`} className="hover:underline">{channel.user.displayName}</Link></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <ChannelSettings
                channel={{
                  id: channel.id,
                  name: channel.name,
                  description: channel.description,
                  coverUrl: channel.coverUrl,
                  isPublic: channel.isPublic,
                }}
                canDelete={isOwner || isSiteAdmin}
              />
            )}
            {canManage && <AddVideoToChannelButton channelId={channel.id} />}
            {currentUser && (
              <ChannelFollowButton
                channelId={channel.id}
                initialFollowing={isFollowing}
                followerCount={channel._count.followers}
              />
            )}
          </div>
        </div>

        {/* Videos */}
        {videos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="font-sans font-semibold text-base text-core-black">No videos yet</p>
            <p className="font-sans text-sm text-foreground/40">
              {canManage ? "Use the 'Add Video' button to curate videos into this channel." : "Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-16 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} showTimestamp />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
