import Link from "next/link"
import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { HeroSection } from "./HeroSection"
import { VideoCard } from "@/components/common/VideoCard"

// Placeholder cards shown until real videos exist
const PLACEHOLDER_COLOURS = [
  "bg-bloom-lavender",
  "bg-sky-blue",
  "bg-sunny-yellow",
  "bg-winter-green",
  "bg-dream-lilac",
  "bg-hyper-blue/50",
  "bg-spring-green/40",
  "bg-bloom-lavender/60",
  "bg-sky-blue/70",
  "bg-sunny-yellow/60",
  "bg-winter-green/70",
  "bg-dream-lilac/80",
]

const FILTER_PILLS = [
  "All", "Motion Design", "3D", "Animation", "VFX",
  "Music Video", "Short Film", "Typography", "Experimental",
]

export default async function HomePage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true, clerkId: true } },
    },
  })

  // Backfill avatarUrl for any users that are missing it
  const missing = videos.map((v) => v.user).filter((u) => !u.avatarUrl)
  if (missing.length > 0) {
    const clerk = await clerkClient()
    await Promise.all(
      missing.map(async (u) => {
        const clerkUser = await clerk.users.getUser(u.clerkId)
        if (clerkUser.imageUrl) {
          await prisma.user.update({
            where: { clerkId: u.clerkId },
            data: { avatarUrl: clerkUser.imageUrl },
          })
          u.avatarUrl = clerkUser.imageUrl
        }
      })
    )
  }

  return (
    <>
      <HeroSection />

      {/* ── Discover feed ────────────────────────────────── */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">

          {/* Section header */}
          <div className="flex flex-col gap-4 py-12 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="display-sm text-core-black">Discover</h2>
              <p className="mt-1 font-sans text-sm text-foreground/50">
                The best motion design, animation, and video from the community.
              </p>
            </div>
            <Link
              href="/search"
              className="shrink-0 inline-flex h-9 items-center rounded-full border border-border px-5 font-sans font-medium text-sm text-foreground/60 hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              Browse all →
            </Link>
          </div>

          {/* Category filter pills */}
          <div className="mb-8 flex flex-wrap gap-2">
            {FILTER_PILLS.map((pill, i) => (
              <Link
                key={pill}
                href={i === 0 ? "/search" : `/search?tag=${encodeURIComponent(pill)}`}
                className={
                  i === 0
                    ? "inline-flex h-8 items-center rounded-full bg-spring-green px-4 font-sans text-xs font-medium text-core-black"
                    : "inline-flex h-8 items-center rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                }
              >
                {pill}
              </Link>
            ))}
          </div>

          {/* Grid */}
          {videos.length === 0 ? (
            <PlaceholderGrid />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}


        </div>
      </section>
    </>
  )
}

// ── Placeholder grid ──────────────────────────────────────

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {PLACEHOLDER_COLOURS.map((bg, i) => (
        <div key={i} className="flex flex-col gap-2">
          {/* Thumbnail */}
          <div className={`aspect-video rounded-xl ${bg}`} />
          {/* Meta skeleton */}
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
