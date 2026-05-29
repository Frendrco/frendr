import { notFound } from "next/navigation"
import { auth, clerkClient } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { Eye, Heart, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoPlayer } from "./VideoPlayer"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const video = await prisma.video.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  })
  if (!video) return {}
  return { title: `${video.title} by ${video.user.displayName} — frendr` }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params
  const { userId: clerkId } = await auth()

  const video = await prisma.video.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!video) notFound()

  const isOwn = clerkId === video.user.clerkId

  const [moreVideos, clerkUser] = await Promise.all([
    prisma.video.findMany({
      where: { userId: video.userId, id: { not: video.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    clerkClient().then((c) => c.users.getUser(video.user.clerkId)),
  ])

  const avatarUrl = clerkUser.imageUrl
  const initials  = video.user.displayName
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-white">

      {/* ── Player ─────────────────────────────────────────── */}
      <div className="bg-core-black w-full">
        <div className="mx-auto max-w-screen-xl">
          <VideoPlayer streamId={video.streamId} title={video.title} />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">

          {/* ── Main column ── */}
          <div className="min-w-0 flex-1">

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-sans font-bold text-xl md:text-2xl text-core-black leading-snug">
                {video.title}
              </h1>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-1">
                {[
                  { icon: <Heart size={15} />,         label: "Like"     },
                  { icon: <Bookmark size={15} />,      label: "Save"     },
                  { icon: <Share2 size={15} />,        label: "Share"    },
                  { icon: <MoreHorizontal size={15} />,label: "More"     },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-2 flex items-center gap-3 text-foreground/40">
              <span className="flex items-center gap-1 font-sans text-xs">
                <Eye size={12} /> 0 views
              </span>
              <span className="font-sans text-xs">·</span>
              <span className="font-sans text-xs">{formattedDate}</span>
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-sans text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Comments placeholder */}
            <div className="mt-10 border-t border-border pt-8">
              <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/30">
                Comments — coming soon
              </p>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-6">

            {/* Creator card */}
            <div className="rounded-2xl border border-border p-5">

              <Link href={`/${video.user.username}`} className="group flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-spring-green ring-2 ring-green-500 ring-offset-2 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={video.user.displayName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-sans font-bold text-sm text-core-black">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-sans font-bold text-sm text-core-black group-hover:underline">
                    {video.user.displayName}
                  </p>
                  {video.user.role && (
                    <p className="truncate font-sans text-xs text-foreground/40">{video.user.role}</p>
                  )}
                </div>
              </Link>

              {video.user.bio && (
                <p className="mt-3 font-sans text-xs leading-relaxed text-foreground/60 line-clamp-3">
                  {video.user.bio}
                </p>
              )}

              {/* Skills */}
              {video.user.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {video.user.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2 py-0.5 font-sans text-[10px] text-foreground/40">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4">
                {isOwn ? (
                  <Link
                    href="/dashboard/settings"
                    className="flex h-9 w-full items-center justify-center rounded-full border border-border font-sans font-medium text-sm text-core-black transition-colors hover:bg-foreground/5"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <button className="h-9 w-full rounded-full bg-spring-green font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/90">
                    Follow
                  </button>
                )}
              </div>
            </div>

            {/* More from creator */}
            {moreVideos.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/40">
                    More from {video.user.displayName.split(" ")[0]}
                  </p>
                  <Link
                    href={`/${video.user.username}`}
                    className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
                  >
                    See all
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  {moreVideos.map((v) => (
                    <Link key={v.id} href={`/v/${v.id}`} className="group flex items-center gap-3">
                      <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-mist-grey">
                        {v.thumbnailUrl ? (
                          <Image
                            src={v.thumbnailUrl}
                            alt={v.title}
                            width={96}
                            height={56}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                          />
                        ) : (
                          <div className="h-full w-full bg-mist-grey" />
                        )}
                      </div>
                      <p className="flex-1 font-sans text-xs font-medium text-core-black line-clamp-2 leading-snug group-hover:underline">
                        {v.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>
    </div>
  )
}
