import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { RecessGrid } from "./RecessGrid"
import { RecessSearchInput } from "./RecessSearchInput"

type Props = { searchParams: Promise<{ q?: string }> }

export default async function RecessPage({ searchParams }: Props) {
  const [{ q = "" }, { userId: clerkId }] = await Promise.all([searchParams, auth()])
  const query = q.trim()

  // Fetch optional following list for the current user
  let followedUserIds: string[] = []
  let isAuthenticated = false
  if (clerkId) {
    isAuthenticated = true
    const currentUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (currentUser) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      followedUserIds = follows.map((f) => f.followingId)
    }
  }

  const videos = await prisma.video.findMany({
    where: {
      visibility: "PUBLIC" as const,
      hideFromFeeds: false,
      videoType: "RECESS",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { user: { displayName: { contains: query, mode: "insensitive" } } },
              { tags: { hasSome: [query] } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  })

  const mapped = videos.map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    streamId: v.streamId,
    externalUrl: v.externalUrl,
    tags: v.tags,
    categories: v.categories,
    likeCount: v._count.likes,
    userId: v.user.id,
    user: {
      username: v.user.username,
      displayName: v.user.displayName,
      avatarUrl: v.user.avatarUrl,
    },
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">

        {/* Header */}
        <div className="pt-8 pb-6 border-b border-border">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left gap-3">
            <div>
              <h1 className="font-sans font-bold text-2xl text-foreground">Recess</h1>
              <p className="mt-1 font-sans text-sm text-foreground/40">Making things for the fun of it</p>
            </div>
            <Link
              href="/dashboard/upload?type=recess"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-spring-green px-4 font-sans font-medium text-sm text-core-black transition-colors hover:bg-core-black hover:text-white"
            >
              + Drop something
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="pt-5 pb-4">
          <RecessSearchInput defaultValue={query} />
        </div>

        {/* Grid with sort + filter */}
        <div className="pb-16">
          {query && mapped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-sans font-semibold text-sm text-foreground">No results for &ldquo;{query}&rdquo;</p>
              <p className="font-sans text-sm text-foreground/40">Try a different title, creator, or tool name.</p>
            </div>
          ) : mapped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-sans font-semibold text-sm text-foreground">Nothing here yet</p>
              <p className="font-sans text-sm text-foreground/40">Be the first to drop something.</p>
            </div>
          ) : (
            <>
              {query && (
                <p className="mb-4 font-sans text-sm text-foreground/40">
                  {mapped.length} result{mapped.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                </p>
              )}
              <RecessGrid
                videos={mapped}
                followedUserIds={followedUserIds}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </div>

      </div>
    </div>
  )
}
