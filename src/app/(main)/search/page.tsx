import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { FrendrSelectsMarquee } from "./FrendrSelectsMarquee"
import { VideoCard } from "@/components/common/VideoCard"
import { VideoGridWithLoadMore } from "@/components/common/VideoGridWithLoadMore"
import { RecessCard } from "@/components/common/RecessCard"
import { ExploreSort } from "./ExploreSort"
import { FollowButton } from "@/components/common/FollowButton"
import { CONTENT_TAGS, VIDEO_TAGS } from "@/lib/categories"
import { TagBar } from "./TagBar"

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse motion design, animation, and creative video from the world's best creators.",
}

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

const TAGS = ["All", ...CONTENT_TAGS]

const PLACEHOLDER_COLOURS = [
  "bg-bloom-lavender", "bg-sky-blue", "bg-sunny-yellow", "bg-winter-green",
  "bg-dream-lilac", "bg-hyper-blue/50", "bg-spring-green/40", "bg-bloom-lavender/60",
]

type SortValue = "newest" | "trending" | "following"

type Props = { searchParams: Promise<{ q?: string; tag?: string; sort?: string; type?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { userId: clerkId } = await auth()

  const { q = "", tag = "", sort = "newest", type = "" } = await searchParams
  const query = q.trim()
  const activeTag = tag || "All"
  const isCategoryTag = CONTENT_TAGS.includes(activeTag)
  const isSearching = query.length > 0
  const isRecessView = type === "recess"
  const activeSort = (["newest", "trending", "following"].includes(sort) ? sort : "newest") as SortValue

  // "following" sort has an unavoidable dependency chain: user → followingIds → video query.
  // Resolve it up front only for that case; every other sort skips this entirely.
  let followingIds: string[] = []
  let prefetchedUserId: string | null = null
  if (clerkId && !isSearching && activeSort === "following") {
    const u = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    prefetchedUserId = u?.id ?? null
    if (prefetchedUserId) {
      const follows = await prisma.follow.findMany({ where: { followerId: prefetchedUserId }, select: { followingId: true } })
      followingIds = follows.map(f => f.followingId)
    }
  }

  const lowerQuery = query.toLowerCase()
  const matchingTags = VIDEO_TAGS.filter(t => t.toLowerCase().includes(lowerQuery))
  const matchingCategories = CONTENT_TAGS.filter(c => c.toLowerCase().includes(lowerQuery))

  const videoWhere = isSearching
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
          ...(matchingTags.length > 0 ? [{ tags: { hasSome: matchingTags } }] : []),
          ...(matchingCategories.length > 0 ? [{ categories: { hasSome: matchingCategories } }] : []),
        ],
      }
    : isRecessView
    ? { isPublic: true, videoType: "RECESS" as const }
    : activeSort === "following"
    ? {
        userId: { in: followingIds },
        videoType: "PORTFOLIO" as const,
        ...(activeTag !== "All"
          ? (isCategoryTag ? { categories: { has: activeTag } } : { tags: { has: activeTag } })
          : {}),
      }
    : activeTag !== "All"
    ? {
        ...(isCategoryTag ? { categories: { has: activeTag } } : { tags: { has: activeTag } }),
        videoType: "PORTFOLIO" as const,
      }
    : { videoType: "PORTFOLIO" as const, isPublic: true }

  const videoOrderBy =
    activeSort === "trending"
      ? [{ featured: "desc" as const }, { createdAt: "desc" as const }]
      : { createdAt: "desc" as const }

  // Everything runs in one parallel batch. currentUser is included here for the non-"following"
  // sort case so it doesn't add a sequential round-trip before the main queries.
  const [currentUser, videos, creators, featuredVideos, featuredChannels, newMembers, recessVideosRaw] = await Promise.all([
    // currentUser — needed for new-member follow status; already resolved for "following" sort
    prefetchedUserId
      ? Promise.resolve({ id: prefetchedUserId })
      : clerkId && !isSearching
        ? prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
        : Promise.resolve(null),
    prisma.video.findMany({
      where: videoWhere,
      orderBy: videoOrderBy,
      take: 24,
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
      },
    }),
    isSearching
      ? prisma.user.findMany({
          where: {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { role: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
          take: 6,
        })
      : Promise.resolve([]),
    !isSearching
      ? prisma.video.findMany({
          where: { featured: true },
          orderBy: { updatedAt: "desc" },
          take: 12,
          include: {
            user: { select: { username: true, displayName: true } },
          },
        })
      : Promise.resolve([]),
    !isSearching
      ? prisma.channel.findMany({
          where: { featured: true, isPublic: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 10,
          select: {
            id: true, name: true, slug: true, description: true,
            coverUrl: true, color: true, type: true,
            videos: {
              take: 1,
              orderBy: { addedAt: "desc" },
              include: { video: { select: { thumbnailUrl: true, streamId: true } } },
            },
          },
        })
      : Promise.resolve([]),
    !isSearching
      ? prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        })
      : Promise.resolve([]),
    !isSearching && !isRecessView
      ? prisma.video.findMany({
          where: { isPublic: true, videoType: "RECESS" },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { username: true, displayName: true, avatarUrl: true } },
            _count: { select: { likes: true } },
          },
        })
      : Promise.resolve([]),
  ])

  // Cavalry work always surfaces first in the Recess preview strip
  const recessVideos = recessVideosRaw
    .sort((a, b) => (b.categories.includes("Cavalry") ? 1 : 0) - (a.categories.includes("Cavalry") ? 1 : 0))
    .slice(0, 8)

  // New-member follow status — one quick lookup after the parallel batch
  const currentUserId = currentUser?.id ?? null
  let newMemberFollowingIds = new Set<string>()
  if (currentUser && newMembers.length > 0) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUser.id, followingId: { in: newMembers.map(m => m.id) } },
      select: { followingId: true },
    })
    newMemberFollowingIds = new Set(follows.map(f => f.followingId))
  }

  const noResults = isSearching && videos.length === 0 && creators.length === 0

  return (
    <div className="min-h-screen bg-white text-core-black">

      {/* ── Sticky tag bar ── */}
      <div className="sticky top-16 z-40 bg-white border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <TagBar tags={TAGS} activeTag={activeTag} isSearching={isSearching} />
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8 flex flex-col gap-10">

        {/* ── No results ── */}
        {noResults && (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <p className="font-sans font-semibold text-base text-core-black">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="font-sans text-sm text-foreground/40">
              Try a different search term or browse by tag above
            </p>
          </div>
        )}

        {/* ── Creator results (search only) ── */}
        {isSearching && creators.length > 0 && (
          <section>
            <h2 className="mb-4 font-sans font-bold text-base text-core-black">Creators</h2>
            <div className="flex flex-wrap gap-3">
              {creators.map(creator => {
                const initials = creator.displayName
                  .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                return (
                  <Link
                    key={creator.id}
                    href={`/${creator.username}`}
                    className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:border-foreground/20"
                  >
                    <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full flex items-center justify-center ${creator.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}>
                      {creator.avatarUrl ? (
                        <Image src={creator.avatarUrl} alt={creator.displayName} width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-sans font-bold text-sm text-core-black">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans font-semibold text-sm text-core-black leading-tight">
                        {creator.displayName}
                      </p>
                      <p className="font-sans text-xs text-foreground/40">@{creator.username}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Frendr Selects (browse only) ── */}
        {!isSearching && featuredVideos.length > 0 && (
          <section>
            <h2 className="mb-4 font-sans font-bold text-base text-core-black">Selected by Frendr</h2>
            <FrendrSelectsMarquee videos={featuredVideos} />
          </section>
        )}

        {/* ── Featured Channels (browse only) ── */}
        {!isSearching && featuredChannels.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans font-bold text-base text-core-black">Featured Channels</h2>
              <Link
                href="/channels"
                className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
              >
                See all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:-mx-6 md:px-6 scroll-smooth snap-x snap-mandatory pb-1">
              {featuredChannels.map((ch, i) => {
                const vid = ch.videos[0]?.video
                const cover = ch.coverUrl
                  ?? vid?.thumbnailUrl
                  ?? (vid?.streamId ? `https://videodelivery.net/${vid.streamId}/thumbnails/thumbnail.jpg` : null)
                const colorClass = ch.color
                  ? (COLOR_MAP[ch.color] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
                  : FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                return (
                  <Link
                    key={ch.slug}
                    href={`/channels/${ch.slug}`}
                    className="group shrink-0 w-44 sm:w-60 snap-start"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.02]">
                      {cover ? (
                        <Image src={cover} alt={ch.name} fill className="object-cover" />
                      ) : (
                        <div className={`h-full w-full ${colorClass}`} />
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="font-sans font-medium text-sm text-core-black leading-snug line-clamp-1">{ch.name}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Rive World banner (browse only) ── */}
        {!isSearching && (
          <section>
            <h2 className="mb-4 font-sans font-bold text-base text-core-black">Rive World</h2>
            <Link
              href="/rive"
              className="group flex items-center justify-between gap-6 rounded-2xl bg-bloom-lavender px-8 py-10 transition-all duration-300 hover:brightness-95 hover:scale-[1.005]"
            >
              <p className="font-sans font-bold text-xl text-core-black">Interactive work from the community</p>
              <span className="shrink-0 font-sans font-medium text-sm text-core-black/60 group-hover:text-core-black transition-colors">
                Explore →
              </span>
            </Link>
          </section>
        )}

        {/* ── Frendr School banner (browse only) ── */}
        {!isSearching && (
          <section>
            <h2 className="mb-4 font-sans font-bold text-base text-core-black">Frendr School</h2>
            <div className="flex flex-col gap-4 rounded-2xl bg-sunny-yellow px-8 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="font-sans text-xl text-core-black">
                <span className="font-bold">Tutorials, tips, and courses.</span>{" "}
                Learn from the community — plus the best resources from across the web.
              </p>
              <span className="shrink-0 rounded-full border border-core-black/20 px-4 py-1.5 font-sans font-medium text-sm text-core-black/60">
                Coming soon
              </span>
            </div>
          </section>
        )}

        {/* ── Recess section (browse only, not when in recess view) ── */}
        {!isSearching && !isRecessView && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="font-sans font-bold text-base text-core-black shrink-0">Recess</h2>
                <span className="hidden sm:inline font-sans text-sm text-foreground/40 truncate">Making things for the fun of it</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link
                  href="/dashboard/upload?type=recess"
                  className="inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-full bg-spring-green px-3 sm:px-4 font-sans font-medium text-xs sm:text-sm text-core-black transition-colors hover:bg-core-black hover:text-white"
                >
                  + Drop something
                </Link>
                {recessVideos.length > 0 && (
                  <Link
                    href="/recess"
                    className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
                  >
                    See all →
                  </Link>
                )}
              </div>
            </div>
            {recessVideos.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recessVideos.map((v) => (
                  <RecessCard
                    key={v.id}
                    video={{
                      id: v.id,
                      title: v.title,
                      thumbnailUrl: v.thumbnailUrl,
                      streamId: v.streamId,
                      externalUrl: v.externalUrl,
                      tags: v.tags,
                      categories: v.categories,
                      likeCount: v._count.likes,
                      user: v.user,
                    }}
                    fixedWidth
                  />
                ))}
              </div>
            ) : (
              <p className="font-sans text-sm text-foreground/40">
                No one has dropped anything yet — be the first.
              </p>
            )}
          </section>
        )}

        {/* ── New to Frendr (browse only) ── */}
        {!isSearching && newMembers.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans font-bold text-base text-core-black">New Frends</h2>
              <Link
                href="/frends"
                className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
              >
                See all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 pb-1 scroll-smooth snap-x snap-mandatory md:mx-0 md:px-0 md:grid md:grid-cols-6 lg:grid-cols-8 md:overflow-visible md:snap-none">
              {newMembers.map(member => {
                const initials = member.displayName
                  .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                const isOwn = currentUserId === member.id
                return (
                  <div key={member.id} className="flex flex-col items-center gap-2 shrink-0 w-20 snap-start md:w-auto">
                    <Link href={`/${member.username}`} className="group w-full">
                      <div className="relative w-full overflow-hidden rounded-3xl bg-spring-green aspect-square transition-opacity group-hover:opacity-90">
                        {member.avatarUrl ? (
                          <Image src={member.avatarUrl} alt={member.displayName} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-sans font-bold text-xl text-core-black">{initials}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex w-full flex-col items-center gap-1 text-center">
                      <Link
                        href={`/${member.username}`}
                        className="font-sans font-semibold text-xs text-core-black hover:underline leading-tight line-clamp-1"
                      >
                        {member.displayName}
                      </Link>
                      {!isOwn && (
                        <FollowButton
                          username={member.username}
                          initialIsFollowing={newMemberFollowingIds.has(member.id)}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Full Recess grid (when ?type=recess) ── */}
        {isRecessView && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-base text-core-black">Recess</h2>
                <p className="mt-0.5 font-sans text-sm text-foreground/40">
                  Quick explorations, loops, and tool tests from the community.
                </p>
              </div>
              <Link
                href="/dashboard/upload?type=recess"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-4 font-sans font-medium text-sm text-core-black hover:border-core-black transition-colors"
              >
                + Drop something
              </Link>
            </div>
            {videos.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <p className="font-sans font-semibold text-sm text-core-black">Nothing here yet</p>
                <p className="font-sans text-sm text-foreground/40">Be the first to drop something.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 md:gap-4">
                {videos.map((v) => (
                  <RecessCard
                    key={v.id}
                    video={{
                      id: v.id,
                      title: v.title,
                      thumbnailUrl: v.thumbnailUrl,
                      streamId: v.streamId,
                      externalUrl: v.externalUrl,
                      tags: v.tags,
                      categories: v.categories,
                      user: v.user,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Video results / Explore grid ── */}
        {!noResults && !isRecessView && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans font-bold text-base text-core-black">
                {isSearching ? (
                  <>
                    Videos
                    {videos.length > 0 && (
                      <span className="ml-2 font-normal text-foreground/40">({videos.length})</span>
                    )}
                  </>
                ) : activeTag === "All" ? "Explore Video" : activeTag}
              </h2>
              {!isSearching && <ExploreSort current={activeSort} />}
            </div>

            {videos.length === 0 ? (
              isSearching ? (
                <p className="font-sans text-sm text-foreground/40">No videos match this search.</p>
              ) : activeSort === "following" ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <p className="font-sans font-semibold text-sm text-core-black">Nothing here yet</p>
                  <p className="font-sans text-sm text-foreground/40">
                    Follow some creators to see their work here, or{" "}
                    <a href="/search" className="underline underline-offset-2">browse all videos</a>.
                  </p>
                </div>
              ) : (
                <PlaceholderGrid />
              )
            ) : (
              <VideoGridWithLoadMore initialVideos={videos} showTimestamp />
            )}
          </section>
        )}

      </div>
    </div>
  )
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {PLACEHOLDER_COLOURS.map((bg, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className={`aspect-video rounded-xl ${bg}`} />
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-foreground/0" />
            <div className="flex flex-col gap-1 flex-1 pt-0.5">
              <div className="h-3 w-4/5 rounded-full bg-foreground/0" />
              <div className="h-2.5 w-2/5 rounded-full bg-foreground/0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
