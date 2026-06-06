import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Download, Eye, MoreHorizontal } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoPlayer } from "./VideoPlayer"
import { FeatureButton } from "./FeatureButton"
import { AdminDeleteButton } from "@/app/(main)/admin/AdminDeleteButton"
import { UpvoteButton } from "@/components/common/UpvoteButton"
import { AddToPlaylistButton } from "@/components/common/AddToPlaylistButton"
import { AddToChannelButton } from "@/components/common/AddToChannelButton"
import { ShareButton } from "./ShareButton"
import { VideoOwnerActions } from "@/components/video/VideoOwnerActions"
import { VideoCommentSection, type VideoCommentData } from "./VideoCommentSection"
import { FollowButton } from "@/components/common/FollowButton"
import { ViewTracker } from "./ViewTracker"
import type { Metadata } from "next"

type StreamStatus = "ready" | "processing" | "error" | "unknown"

interface StreamInfo { status: StreamStatus; duration: number | null }

async function getStreamInfo(streamId: string): Promise<StreamInfo> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return { status: "unknown", duration: null }
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } }
    )
    if (!res.ok) return { status: "unknown", duration: null }
    const { result } = await res.json() as { result: { status: { state: string }; duration?: number } }
    const state = result?.status?.state
    const status: StreamStatus =
      state === "ready" ? "ready" : state === "error" ? "error" : "processing"
    return { status, duration: result?.duration ?? null }
  } catch {
    return { status: "unknown", duration: null }
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

  const streamInfo = (!video.externalUrl && video.streamId)
    ? await getStreamInfo(video.streamId)
    : { status: "unknown" as StreamStatus, duration: null }
  const streamStatus = streamInfo.status

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker videoId={id} />

      {/* ── Player ─────────────────────────────────────────── */}
      <div className="bg-core-black w-full">
        <div className="mx-auto max-w-screen-xl">
          <VideoPlayer
            streamId={video.streamId}
            externalUrl={video.externalUrl}
            title={video.title}
            streamStatus={streamStatus}
            autoPlay={video.embedAutoplay || video.videoType === "RECESS"}
            loop={video.embedLoop || video.videoType === "RECESS"}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">

          {/* ── Main column ── */}
          <div className="min-w-0 flex-1">

            {/* Title + action buttons — on mobile: centered column, buttons first; on md+: row with title left, buttons right */}
            <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between md:gap-4">

              {/* Action buttons — first on mobile, last on desktop */}
              <div className="flex shrink-0 items-center gap-1 order-first md:order-last">
                {isAdmin && (
                  <FeatureButton videoId={video.id} initialFeatured={video.featured} />
                )}
                {isAdmin && (
                  <AdminDeleteButton
                    endpoint={`/api/admin/videos/${video.id}`}
                    label="this video"
                    redirectTo={`/${video.user.username}`}
                  />
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
                {currentUser && (
                  <AddToChannelButton videoId={video.id} />
                )}
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
                    streamDuration={streamInfo.duration}
                    videoType={video.videoType}
                    initialTitle={video.title}
                    initialDescription={video.description ?? ""}
                    initialTags={video.tags}
                    initialCategories={video.categories}
                    initialThumbnailUrl={video.thumbnailUrl}
                    initialIsPublic={video.isPublic}
                    initialAllowDownloads={video.allowDownloads}
                    initialEmbedAutoplay={video.embedAutoplay}
                    initialEmbedLoop={video.embedLoop}
                    initialEmbedShowControls={video.embedShowControls}
                    initialAllowEmbedding={video.allowEmbedding}
                    initialCollaborators={video.collaborators.map((c) => ({
                      userId: c.userId,
                      username: c.user.username,
                      displayName: c.user.displayName,
                      avatarUrl: c.user.avatarUrl,
                      role: c.role,
                      status: c.status,
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

              {/* Title — second on mobile, first on desktop */}
              <h1 className="font-sans font-bold text-xl md:text-2xl text-core-black leading-snug text-center md:text-left order-last md:order-first">
                {video.title}
              </h1>
            </div>

            {/* Creator row */}
            <div className="mt-2 flex items-center justify-center md:justify-start gap-3">
              <Link href={`/${video.user.username}`} className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0">
                <div className={`h-5 w-5 shrink-0 rounded-full overflow-hidden flex items-center justify-center ${video.user.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}>
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
            <div className="mt-2 flex items-center justify-center md:justify-start gap-3 text-foreground/40">
              <span className="flex items-center gap-1 font-sans text-xs">
                <Eye size={12} /> {video.viewCount.toLocaleString()} {video.viewCount === 1 ? "view" : "views"}
              </span>
              <span className="font-sans text-xs">·</span>
              <span className="font-sans text-xs">{formattedDate}</span>
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-1.5">
                {video.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-border px-3 py-1 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    {tag}
                  </Link>
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

            {/* Credits — only show accepted */}
            {video.collaborators.some((c) => c.status === "ACCEPTED") && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-sans font-medium text-xs uppercase tracking-widest text-foreground/30 mb-3">Credits</p>
                <div className="flex flex-col gap-2">
                  {video.collaborators.filter((c) => c.status === "ACCEPTED").map(({ user: collab, role }) => (
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
