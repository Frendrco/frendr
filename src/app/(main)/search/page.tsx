import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { timeAgo, cn } from "@/lib/utils"
import { FrendrSelectsMarquee } from "./FrendrSelectsMarquee"

const TAGS = [
  "All", "Motion Design", "Animation", "3D", "Typography",
  "Branding", "Film", "VFX", "Experimental", "Abstract",
  "Loop", "Sound", "Documentary",
]

const PLACEHOLDER_COLOURS = [
  "bg-bloom-lavender", "bg-sky-blue", "bg-sunny-yellow", "bg-winter-green",
  "bg-dream-lilac", "bg-hyper-blue/50", "bg-spring-green/40", "bg-bloom-lavender/60",
]

type Props = { searchParams: Promise<{ q?: string; tag?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", tag = "" } = await searchParams
  const query = q.trim()
  const activeTag = tag || "All"
  const isSearching = query.length > 0

  const videoWhere = isSearching
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : activeTag !== "All"
    ? { tags: { has: activeTag } }
    : undefined

  const [videos, creators, featuredVideos] = await Promise.all([
    prisma.video.findMany({
      where: videoWhere,
      orderBy: { createdAt: "desc" },
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

        {/* ── Video results / Explore grid ── */}
        {!noResults && (
          <section>
            <h2 className="mb-4 font-sans font-bold text-base text-core-black">
              {isSearching ? (
                <>
                  Videos
                  {videos.length > 0 && (
                    <span className="ml-2 font-normal text-foreground/40">({videos.length})</span>
                  )}
                </>
              ) : activeTag === "All" ? "Explore Video" : activeTag}
            </h2>

            {videos.length === 0 ? (
              isSearching ? (
                <p className="font-sans text-sm text-foreground/40">No videos match this search.</p>
              ) : (
                <PlaceholderGrid />
              )
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {videos.map(video => {
                  const initials = video.user.displayName
                    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <Link key={video.id} href={`/v/${video.id}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-mist-grey">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="h-full w-full bg-mist-grey" />
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
                          {video.user.avatarUrl ? (
                            <Image src={video.user.avatarUrl} alt={video.user.displayName} width={24} height={24} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-sans font-bold text-[9px] text-core-black">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-sans font-medium text-sm text-core-black leading-snug">
                            {video.title}
                          </p>
                          <p className="font-sans text-xs text-foreground/40">
                            {video.user.displayName} · {timeAgo(video.createdAt)}
                          </p>
                        </div>
                      </div>
                      {video.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {video.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="rounded-full border border-border px-2 py-0.5 font-sans text-[10px] text-foreground/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  )
                })}
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
