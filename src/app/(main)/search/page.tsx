import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { FrendrSelectsMarquee } from "./FrendrSelectsMarquee"
import { VideoCard } from "@/components/common/VideoCard"
import { ExploreSort } from "./ExploreSort"

const FEATURED_CHANNELS = [
  { name: "Best of Cavalry",       slug: "best-of-cavalry",        bg: "bg-bloom-lavender",    descriptor: "Studio picks" },
  { name: "Good Type",             slug: "good-type",               bg: "bg-sky-blue",           descriptor: "Typography in motion" },
  { name: "Best of Motion Design", slug: "best-of-motion-design",   bg: "bg-sunny-yellow",       descriptor: "Community favourites" },
  { name: "Tutorials",             slug: "tutorials",               bg: "bg-winter-green",       descriptor: "Learn from the best" },
  { name: "Best of Blendr",        slug: "best-of-blendr",          bg: "bg-dream-lilac",        descriptor: "3D & beyond" },
  { name: "AI that isn't slop",    slug: "ai-that-isnt-slop",       bg: "bg-hyper-blue/50",      descriptor: "Thoughtful AI work" },
  { name: "Frendr Picks",          slug: "frendr-picks",            bg: "bg-spring-green/60",    descriptor: "Curated by the team", isAdmin: true },
]

const TAGS = [
  "All", "Motion Design", "Animation", "3D", "Typography",
  "Branding", "Film", "VFX", "Experimental", "Abstract",
  "Loop", "Sound", "Documentary",
]

const PLACEHOLDER_COLOURS = [
  "bg-bloom-lavender", "bg-sky-blue", "bg-sunny-yellow", "bg-winter-green",
  "bg-dream-lilac", "bg-hyper-blue/50", "bg-spring-green/40", "bg-bloom-lavender/60",
]

type SortValue = "newest" | "trending" | "following"

type Props = { searchParams: Promise<{ q?: string; tag?: string; sort?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { userId: clerkId } = await auth()

  const { q = "", tag = "", sort = "newest" } = await searchParams
  const query = q.trim()
  const activeTag = tag || "All"
  const isSearching = query.length > 0
  const activeSort = (["newest", "trending", "following"].includes(sort) ? sort : "newest") as SortValue

  // For "following" sort, look up who the current user follows
  let followingIds: string[] = []
  if (!isSearching && activeSort === "following" && clerkId) {
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (user) {
      const follows = await prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } })
      followingIds = follows.map(f => f.followingId)
    }
  }

  const videoWhere = isSearching
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : activeSort === "following"
    ? { userId: { in: followingIds }, ...(activeTag !== "All" ? { tags: { has: activeTag } } : {}) }
    : activeTag !== "All"
    ? { tags: { has: activeTag } }
    : undefined

  const videoOrderBy =
    activeSort === "trending"
      ? [{ featured: "desc" as const }, { createdAt: "desc" as const }]
      : { createdAt: "desc" as const }

  const [videos, creators, featuredVideos] = await Promise.all([
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
  ])

  const noResults = isSearching && videos.length === 0 && creators.length === 0

  return (
    <div className="min-h-screen bg-white text-core-black">

      {/* ── Sticky tag bar ── */}
      <div className="sticky top-16 z-40 bg-white border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TAGS.map(t => (
              <Link
                key={t}
                href={t === "All" ? "/search" : `/search?tag=${encodeURIComponent(t)}`}
                className={cn(
                  "shrink-0 inline-flex items-center rounded-full px-4 h-8 font-sans font-medium text-sm transition-colors",
                  !isSearching && activeTag === t
                    ? "bg-spring-green text-core-black"
                    : "border border-border bg-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30"
                )}
              >
                {t}
              </Link>
            ))}
          </div>
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
                  .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                return (
                  <Link
                    key={creator.id}
                    href={`/${creator.username}`}
                    className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:border-foreground/20"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
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
                      {creator.role && (
                        <p className="font-sans text-xs text-foreground/50 mt-0.5">{creator.role}</p>
                      )}
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
        {!isSearching && (
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
              {FEATURED_CHANNELS.map((ch) => (
                <Link
                  key={ch.slug}
                  href={`/channels/${ch.slug}`}
                  className="group shrink-0 w-60 snap-start"
                >
                  {/* Colour card — 16:9 to match video cards */}
                  <div className={`relative aspect-video overflow-hidden rounded-xl ${ch.bg} transition-transform duration-300 group-hover:scale-[1.02]`}>
                    {ch.isAdmin && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 backdrop-blur-sm">
                        <Sparkles size={9} className="text-core-black" />
                        <span className="font-sans font-medium text-[9px] text-core-black">Frendr</span>
                      </div>
                    )}
                  </div>
                  {/* Meta */}
                  <div className="mt-2">
                    <p className="font-sans font-medium text-sm text-core-black leading-snug line-clamp-1">{ch.name}</p>
                    <p className="font-sans text-xs text-foreground/40">{ch.descriptor}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Video results / Explore grid ── */}
        {!noResults && (
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} showTimestamp />
                ))}
              </div>
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
            <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-foreground/8" />
            <div className="flex flex-col gap-1 flex-1 pt-0.5">
              <div className="h-3 w-4/5 rounded-full bg-foreground/8" />
              <div className="h-2.5 w-2/5 rounded-full bg-foreground/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
