import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Download, Eye, MoreHorizontal } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoPlayer } from "./VideoPlayer"
import { FeatureButton } from "./FeatureButton"
import { UpvoteButton } from "./UpvoteButton"
import { AddToPlaylistButton } from "@/components/common/AddToPlaylistButton"
import { ShareButton } from "./ShareButton"
import { VideoOwnerActions } from "@/components/video/VideoOwnerActions"
import { VideoCommentSection, type VideoCommentData } from "./VideoCommentSection"
import { FollowButton } from "@/components/common/FollowButton"
import { ViewTracker } from "./ViewTracker"
import type { Metadata } from "next"

type StreamStatus = "ready" | "processing" | "error" | "unknown"

async function getStreamStatus(streamId: string): Promise<StreamStatus> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return "unknown"
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } }
    )
    if (!res.ok) return "unknown"
    const { result } = await res.json() as { result: { status: { state: string } } }
    const state = result?.status?.state
    if (state === "ready") return "ready"
    if (state === "error") return "error"
    return "processing"
  } catch {
    return "unknown"
  }
}

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

  const [video, currentUser] = await Promise.all([
    prisma.video.findUnique({
      where: { id },
      include: {
        user: true,
        _count: { select: { likes: true } },
        collaborators: {
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
          orderBy: { addedAt: "asc" },
        },
      },
    }),
    clerkId ? prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } }) : null,
  ])

  if (!video) notFound()

  const isAdmin = currentUser?.isAdmin
  const isOwner = clerkId != null && video.user.clerkId === clerkId

  const [upvoteData, savedData, rawComments, followData] = await Promise.all([
    currentUser
      ? prisma.videoLike.findUnique({
          where: { videoId_userId: { videoId: id, userId: currentUser.id } },
        })
      : null,
    currentUser
      ? prisma.playlistVideo.findFirst({
          where: { videoId: id, playlist: { userId: currentUser.id, isDefault: true } },
        })
      : null,
    prisma.comment.findMany({
      where: { videoId: id, parentCommentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        votes: true,
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            votes: true,
          },
        },
      },
    }),
    (!isOwner && currentUser)
      ? prisma.follow.findFirst({
          where: { followerId: currentUser.id, followingId: video.user.id },
        })
      : null,
  ])

  const comments: VideoCommentData[] = rawComments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    userVote: currentUser
      ? ((c.votes.find((v) => v.userId === currentUser.id)?.value ?? 0) as 1 | -1 | 0)
      : 0,
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      userVote: currentUser
        ? ((r.votes.find((v) => v.userId === currentUser.id)?.value ?? 0) as 1 | -1 | 0)
        : 0,
    })),
  }))

  const streamStatus = (!video.externalUrl && video.streamId)
    ? await getStreamStatus(video.streamId)
    : "unknown"

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker videoId={id} />

      {/* ── Player ─────────────────────────────────────────── */}
      <div className="bg-core-black w-full">
        <div className="mx-auto max-w-screen-xl">
          <VideoPlayer streamId={video.streamId} externalUrl={video.externalUrl} title={video.title} streamStatus={streamStatus} />
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
                {isAdmin && (
                  <FeatureButton videoId={video.id} initialFeatured={video.featured} />
                )}
                <UpvoteButton
                  videoId={video.id}
                  initialUpvoted={!!upvoteData}
                  initialCount={video._count.likes}
                />
                <AddToPlaylistButton
                  videoId={video.id}
                  initialSaved={!!savedData}
                  triggerClassName="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
                />
                {video.allowDownloads && video.streamId && (
                  <a
                    href={`https://videodelivery.net/${video.streamId}/downloads/default.mp4`}
                    download
                    aria-label="Download video"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <Download size={15} />
                  </a>
                )}
                <ShareButton title={video.title} videoId={video.id} />
                {isOwner ? (
                  <VideoOwnerActions
                    videoId={video.id}
                    username={video.user.username}
                    streamId={video.streamId}
                    initialTitle={video.title}
                    initialDescription={video.description ?? ""}
                    initialTags={video.tags}
                    initialThumbnailUrl={video.thumbnailUrl}
                    initialIsPublic={video.isPublic}
                    initialAllowDownloads={video.allowDownloads}
                    initialCollaborators={video.collaborators.map((c) => ({
                      userId: c.userId,
                      username: c.user.username,
                      displayName: c.user.displayName,
                      avatarUrl: c.user.avatarUrl,
                      role: c.role,
                    }))}
                  />
                ) : (
                  <button
                    aria-label="More"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Creator row */}
            <div className="mt-2 flex items-center gap-3">
              <Link href={`/${video.user.username}`} className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0">
                <div className="h-5 w-5 shrink-0 rounded-full overflow-hidden bg-spring-green flex items-center justify-center">
                  {video.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.user.avatarUrl} alt={video.user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-sans font-bold text-[7px] text-core-black">{video.user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-sans text-sm text-foreground/60">{video.user.displayName}</span>
              </Link>
              {!isOwner && (
                <FollowButton
                  username={video.user.username}
                  initialIsFollowing={!!followData}
                  size="sm"
                />
              )}
            </div>

            {/* Meta row */}
            <div className="mt-2 flex items-center gap-3 text-foreground/40">
              <span className="flex items-center gap-1 font-sans text-xs">
                <Eye size={12} /> {video.viewCount.toLocaleString()} {video.viewCount === 1 ? "view" : "views"}
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

            {/* Credits */}
            {video.collaborators.length > 0 && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-sans font-medium text-xs uppercase tracking-widest text-foreground/30 mb-3">Credits</p>
                <div className="flex flex-col gap-2">
                  {video.collaborators.map(({ user: collab, role }) => (
                    <div key={collab.username} className="flex items-baseline gap-3">
                      <Link
                        href={`/${collab.username}`}
                        className="font-sans text-xs font-medium text-core-black hover:underline shrink-0"
                      >
                        {collab.displayName}
                      </Link>
                      {role && (
                        <span className="font-sans text-xs text-foreground/40">{role}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mt-10 border-t border-border pt-8">
              <VideoCommentSection
                videoId={video.id}
                initialComments={comments}
                currentUserId={currentUser?.id}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
