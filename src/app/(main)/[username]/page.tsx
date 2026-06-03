import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Globe } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { AvailableForWork } from "@/components/common/AvailableForWork"
import { FollowButton } from "@/components/common/FollowButton"
import { MessageButton } from "@/components/messages/MessageButton"
import { CoverImage } from "./CoverImage"
import { PinnedVideo } from "./PinnedVideo"
import { EditProfileModal } from "./EditProfileModal"
import { ProfileVideoGrid } from "./ProfileVideoGrid"
import { AdminDeleteButton } from "@/app/(main)/admin/AdminDeleteButton"
import type { Metadata } from "next"

const PLACEHOLDER_CARDS = [
  { id: 1, bg: "bg-bloom-lavender" },
  { id: 2, bg: "bg-sky-blue" },
  { id: 3, bg: "bg-sunny-yellow" },
  { id: 4, bg: "bg-winter-green" },
  { id: 5, bg: "bg-dream-lilac" },
  { id: 6, bg: "bg-hyper-blue/40" },
]

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return {}
  return { title: `${user.displayName} (@${user.username}) — frendr` }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const { userId: clerkId } = await auth()

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      videos:   { orderBy: [{ position: "asc" }, { createdAt: "desc" }], take: 48 },
      _count:   { select: { followers: true, following: true } },
    },
  })

  function getPresence(date: Date | null): { label: string; online: boolean } | null {
    if (!date) return null
    const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
    if (mins < 10) return { label: "Online", online: true }
    const days = Math.floor(mins / (60 * 24))
    if (days === 0) return { label: "Active today", online: false }
    if (days === 1) return { label: "Active yesterday", online: false }
    if (days <= 13) return { label: `Active ${days} days ago`, online: false }
    return null
  }

  if (!user) notFound()

  const isOwn = clerkId === user.clerkId

  const avatarUrl = user.avatarUrl ?? null

  const initials = user.displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Is the current visitor following this profile? (single query via relation join)
  const followRecord = !isOwn && clerkId
    ? await prisma.follow.findFirst({
        where: { follower: { clerkId }, followingId: user.id },
        select: { follower: { select: { id: true, isAdmin: true } } },
      })
    : null
  const isFollowing = !!followRecord
  const isAdmin = followRecord?.follower.isAdmin ?? false

  const stats = [
    { label: "Followers", value: String(user._count.followers), href: `/${username}/followers` },
    { label: "Following", value: String(user._count.following), href: `/${username}/following` },
  ]

  function buildHref(value: string | null, base?: string): string | null {
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("www.")) return `https://${value}`
    return base ? `${base}${value}` : `https://${value}`
  }

  const socials = [
    { key: "instagram", href: buildHref(user.instagram, "https://www.instagram.com/"), label: "IG" },
    { key: "linkedin",  href: buildHref(user.linkedin,  "https://www.linkedin.com/in/"), label: "in" },
    { key: "playlist",  href: buildHref(user.playlist),  label: "♫"  },
    { key: "substack",  href: buildHref(user.substack),  label: "SS" },
    { key: "patreon",   href: buildHref(user.patreon),   label: "Pa" },
    { key: "behance",   href: buildHref(user.behance,  "https://www.behance.net/"), label: "Be" },
    { key: "other",     href: buildHref(user.other),     label: "↗"  },
  ].filter((s): s is { key: string; href: string; label: string } => Boolean(s.href))

  const pinnedVideo = user.pinnedVideoId
    ? (user.videos.find((v) => v.id === user.pinnedVideoId) ?? null)
    : null

  const gridVideos = pinnedVideo
    ? user.videos.filter((v) => v.id !== user.pinnedVideoId)
    : user.videos

  return (
    <div className="min-h-screen bg-white">

      {/* ── Cover image ──────────────────────────────────────── */}
      <CoverImage initialCoverUrl={user.coverImageUrl} isOwn={isOwn} />

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 pb-10">

        {/* ── Avatar — overlaps cover bottom edge ───────────── */}
        <div className="-mt-9 mb-4 flex justify-center md:justify-start relative z-10">
          {/* ring-4 on the outer element so it isn't clipped by overflow-hidden */}
          <div className="h-[72px] w-[72px] rounded-full ring-4 ring-white">
            <div className="h-full w-full overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={user.displayName} width={72} height={72} className="h-full w-full object-cover" />
              ) : (
                <span className="font-sans font-bold text-xl text-core-black">{initials}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="shrink-0 md:w-52 lg:w-56">

            {/* Name + role */}
            <div className="mb-4 flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <h1 className="font-sans font-bold text-base text-core-black leading-tight">{user.displayName}</h1>
              {user.role && (
                <p className="font-sans text-xs text-foreground/50">{user.role}</p>
              )}
              {(() => {
                const p = getPresence(user.lastActiveAt)
                return p ? (
                  <p className="flex items-center gap-1.5 font-sans text-xs text-foreground/40">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.online ? "bg-spring-green" : "bg-foreground/25"}`} />
                    {p.label}
                  </p>
                ) : null
              })()}
              <AvailableForWork initial={user.openToWork} isOwn={isOwn} />
            </div>

            {/* Stats — followers + following only */}
            <div className="mb-4 w-full">
              {stats.map(({ label, value, href }) => (
                <div key={label} className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
                  <span className="font-sans text-xs text-foreground/50">{label}</span>
                  <Link href={href} className="font-sans text-xs font-semibold text-core-black hover:underline">
                    {value}
                  </Link>
                </div>
              ))}
            </div>

            {/* Location + website */}
            {user.location && (
              <div className="mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                <MapPin size={11} className="shrink-0 text-foreground/40" />
                <span className="font-sans text-xs text-foreground/60">{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="mb-4 flex items-center gap-1.5 justify-center md:justify-start">
                <Globe size={11} className="shrink-0 text-foreground/40" />
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs text-core-black hover:underline truncate"
                >
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <div className="mb-4">
                <p className="mb-1 font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/30 text-center md:text-left">Bio</p>
                <p className="font-sans text-xs leading-relaxed text-foreground/60">{user.bio}</p>
              </div>
            )}

            {/* Social links */}
            {socials.length > 0 && (
              <div className="mb-4 flex gap-2 justify-center md:justify-start">
                {socials.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href.startsWith("http") ? href : `https://${href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border font-sans font-bold text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}

            {/* Skills */}
            {user.tags.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/30">Skills</p>
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {user.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2.5 py-0.5 font-sans text-xs text-foreground/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit profile (owner) / Follow button (visitors) */}
            {isOwn ? (
              <EditProfileModal
                profile={{
                  displayName: user.displayName,
                  location:    user.location,
                  bio:         user.bio,
                  website:     user.website,
                  role:        user.role,
                  instagram:   user.instagram,
                  linkedin:    user.linkedin,
                  patreon:     user.patreon,
                  substack:    user.substack,
                  playlist:    user.playlist,
                  behance:     user.behance,
                  other:       user.other,
                  tags:        user.tags,
                }}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <FollowButton
                  username={username}
                  initialIsFollowing={isFollowing}
                  size="md"
                />
                {clerkId && (
                  <MessageButton recipientId={user.id} />
                )}
                {isAdmin && (
                  <div className="mt-2 border-t border-border pt-3">
                    <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/30">Admin</p>
                    <AdminDeleteButton
                      endpoint={`/api/admin/users/${user.id}`}
                      label={`${user.displayName}'s account`}
                      redirectTo="/admin/users"
                    />
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ── Main content ────────────────────────────────── */}
          <main className="min-w-0 flex-1">

            {/* Tab bar */}
            <div className="mb-6 border-b border-border pb-0">
              <div className="flex gap-6">
                <Link
                  href={`/${username}`}
                  className="pb-3 font-sans font-medium text-sm border-b-2 border-core-black text-core-black"
                >
                  Videos
                </Link>
                <Link
                  href={`/${username}/playlists`}
                  className="pb-3 font-sans font-medium text-sm border-b-2 border-transparent text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  Playlists
                </Link>
              </div>
            </div>

            {/* Pinned video slot */}
            {pinnedVideo ? (
              <PinnedVideo video={pinnedVideo} isOwn={isOwn} />
            ) : isOwn && user.videos.length > 0 ? (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3">
                <p className="font-sans text-xs text-foreground/40">
                  Hover any video and click the pin icon to feature it here.
                </p>
              </div>
            ) : null}

            {/* All videos heading */}
            <div className="mb-4">
              <h2 className="font-sans font-bold text-sm text-core-black">
                All Videos
                {gridVideos.length > 0 && (
                  <span className="ml-2 font-normal text-foreground/40">({gridVideos.length})</span>
                )}
              </h2>
              {isOwn && gridVideos.length > 1 && (
                <p className="font-sans text-xs text-foreground/30 mt-0.5">Drag to reorder</p>
              )}
            </div>

            {/* Video grid or colour placeholders */}
            {gridVideos.length === 0 && !pinnedVideo ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                {PLACEHOLDER_CARDS.map((card) => (
                  <div key={card.id}>
                    <div className={`mb-2 aspect-video overflow-hidden rounded-xl ${card.bg}`} />
                    <div className="h-3 w-3/4 rounded-full bg-foreground/10" />
                    <div className="mt-1.5 h-2.5 w-1/3 rounded-full bg-foreground/6" />
                  </div>
                ))}
              </div>
            ) : (
              <ProfileVideoGrid
                initialVideos={gridVideos.map((v) => ({
                  id: v.id,
                  title: v.title,
                  thumbnailUrl: v.thumbnailUrl,
                  streamId: v.streamId,
                  externalUrl: v.externalUrl,
                  featured: v.featured,
                  tags: v.tags,
                  createdAt: v.createdAt,
                  user: {
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                  },
                }))}
                pinnedVideoId={user.pinnedVideoId}
                username={user.username}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
                isOwn={isOwn}
              />
            )}
          </main>

        </div>
      </div>
    </div>
  )
}
