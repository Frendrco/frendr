import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"

export default async function FeedPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, displayName: true },
  })
  if (!currentUser) redirect("/sign-in")

  // Get IDs of everyone this user follows
  const follows = await prisma.follow.findMany({
    where: { followerId: currentUser.id },
    select: { followingId: true },
  })
  const followingIds = follows.map(f => f.followingId)

  const videos = followingIds.length > 0
    ? await prisma.video.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: 60,
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true } },
        },
      })
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl text-core-black">Your Feed</h1>
          {followingIds.length > 0 && (
            <p className="mt-1 font-sans text-sm text-foreground/40">
              Latest from the {followingIds.length} {followingIds.length === 1 ? "creator" : "creators"} you follow
            </p>
          )}
        </div>

        {followingIds.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-spring-green/20">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <p className="font-sans font-semibold text-base text-core-black">Your feed is empty</p>
              <p className="mt-1 font-sans text-sm text-foreground/40">
                Follow some creators to see their work here
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 inline-flex h-9 items-center rounded-full bg-spring-green px-6 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90"
            >
              Discover Creators
            </Link>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-32 text-center">
            <p className="font-sans font-semibold text-base text-core-black">Nothing posted yet</p>
            <p className="font-sans text-sm text-foreground/40">
              The creators you follow haven't posted any videos yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {videos.map(video => (
              <Link key={video.id} href={`/v/${video.id}`} className="group">
                <div className="mb-3 aspect-video w-full overflow-hidden rounded-2xl bg-mist-grey transition-opacity group-hover:opacity-90">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={480}
                      height={270}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-mist-grey" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
                    {video.user.avatarUrl ? (
                      <Image
                        src={video.user.avatarUrl}
                        alt={video.user.displayName}
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-sans font-bold text-[9px] text-core-black">
                        {video.user.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-medium text-sm text-core-black leading-snug line-clamp-1">
                      {video.title}
                    </p>
                    <p className="font-sans text-xs text-foreground/40">
                      {video.user.displayName} · {timeAgo(video.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
