import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

// Floating blobs in hero
const BLOBS = [
  { id: 1, bg: "bg-bloom-lavender", style: { top: "12%",    left:  "6%",  width: 192, height: 192 } },
  { id: 2, bg: "bg-sky-blue",       style: { top:  "6%",    right: "9%",  width: 152, height: 152 } },
  { id: 3, bg: "bg-sunny-yellow",   style: { bottom: "18%", left:  "11%", width: 112, height: 112 } },
  { id: 4, bg: "bg-winter-green",   style: { bottom: "10%", right: "6%",  width: 208, height: 208 } },
]

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

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-16">

        {/* Floating blobs */}
        {BLOBS.map((b) => (
          <div key={b.id} className={`absolute rounded-full ${b.bg} hidden sm:block`} style={b.style} />
        ))}

        {/* Centre stack */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 gap-0">
          <h1 className="display-md text-core-black">
            Designed for creativity.<br />Built for belonging.
          </h1>

          <div className="-mt-4 w-[280px] sm:w-[380px] md:w-[460px] lg:w-[520px]">
            <Image
              src="/images/logo-3d.png"
              alt="frendr"
              width={520}
              height={260}
              className="w-full h-auto drop-shadow-sm"
              priority
            />
          </div>

          <Link
            href="/sign-up"
            className="mt-6 inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90"
          >
            Join Free
          </Link>
        </div>
      </section>

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
              <button
                key={pill}
                className={
                  i === 0
                    ? "h-8 rounded-full bg-core-black px-4 font-sans text-xs font-medium text-white"
                    : "h-8 rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                }
              >
                {pill}
              </button>
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

// ── Real video card ───────────────────────────────────────

type VideoWithUser = Awaited<ReturnType<typeof prisma.video.findMany>>[number] & {
  user: { username: string; displayName: string; avatarUrl: string | null; clerkId: string }
}

function VideoCard({ video }: { video: VideoWithUser }) {
  const initials = video.user.displayName
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <Link href={`/v/${video.id}`} className="group flex flex-col gap-2">
      {/* Thumbnail */}
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

      {/* Meta */}
      <div className="flex items-start gap-2">
        {/* Creator avatar */}
        <div className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
          {video.user.avatarUrl ? (
            <Image src={video.user.avatarUrl} alt={video.user.displayName} width={24} height={24} className="h-full w-full object-cover" />
          ) : (
            <span className="font-sans font-bold text-[9px] text-core-black">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-sans font-medium text-sm text-core-black leading-snug">{video.title}</p>
          <p className="font-sans text-xs text-foreground/40">{video.user.displayName}</p>
        </div>
      </div>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="flex gap-1">
          {video.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 font-sans text-[10px] text-foreground/40">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
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
