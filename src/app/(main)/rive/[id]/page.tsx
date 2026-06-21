import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"
import { ThreadLikeButton } from "@/components/common/ThreadLikeButton"
import { CommentSection } from "../../community/[threadId]/CommentSection"
import { RivePostActions } from "./RivePostActions"

type Props = { params: Promise<{ id: string }> }

export default async function RiveDetailPage({ params }: Props) {
  const { id } = await params
  const { userId: clerkId } = await auth()

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  })

  if (!thread || thread.riveUrls.length === 0) notFound()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  const isOwner = currentUser?.id === thread.userId

  const [threadLike, comments] = await Promise.all([
    currentUser
      ? prisma.threadLike.findUnique({
          where: { threadId_userId: { threadId: id, userId: currentUser.id } },
        })
      : null,
    prisma.comment.findMany({
      where: { threadId: id, parentCommentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        likes: { include: { user: { select: { username: true, displayName: true, avatarUrl: true } } } },
        reactions: true,
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { username: true, displayName: true, avatarUrl: true } },
            likes: { include: { user: { select: { username: true, displayName: true, avatarUrl: true } } } },
            reactions: true,
          },
        },
      },
    }),
  ])

  const threadLikedBy = await prisma.threadLike.findMany({
    where: { threadId: id },
    take: 10,
    orderBy: { createdAt: "asc" },
    include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
  })

  const allCommentIds = [
    ...comments.map((c) => c.id),
    ...comments.flatMap((c) => c.replies.map((r) => r.id)),
  ]
  const [commentLikeRows, commentReactionRows] = await Promise.all([
    currentUser && allCommentIds.length > 0
      ? prisma.commentLike.findMany({ where: { userId: currentUser.id, commentId: { in: allCommentIds } }, select: { commentId: true } })
      : [],
    currentUser && allCommentIds.length > 0
      ? prisma.commentReaction.findMany({ where: { userId: currentUser.id, commentId: { in: allCommentIds } }, select: { commentId: true, emoji: true } })
      : [],
  ])
  const likedCommentIds = new Set(commentLikeRows.map((r) => r.commentId))
  const userReactionMap = new Map<string, Set<string>>()
  for (const r of commentReactionRows) {
    if (!userReactionMap.has(r.commentId)) userReactionMap.set(r.commentId, new Set())
    userReactionMap.get(r.commentId)!.add(r.emoji)
  }

  function buildReactions(rawReactions: Array<{ emoji: string }>, commentId: string) {
    const counts = new Map<string, number>()
    for (const r of rawReactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1)
    const userEmojis = userReactionMap.get(commentId) ?? new Set()
    return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count, reacted: userEmojis.has(emoji) }))
  }

  const commentsWithVotes = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    userVote: 0 as 0,
    likeCount: c.likes.length,
    liked: likedCommentIds.has(c.id),
    likedBy: c.likes.map((l) => l.user),
    reactions: buildReactions(c.reactions, c.id),
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      userVote: 0 as 0,
      likeCount: r.likes.length,
      liked: likedCommentIds.has(r.id),
      likedBy: r.likes.map((l) => l.user),
      reactions: buildReactions(r.reactions, r.id),
    })),
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <Link
          href="/rive"
          className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft size={13} /> Back to Rive World
        </Link>

        {/* Rive embed */}
        <div className="w-full rounded-2xl overflow-hidden border border-border" style={{ height: 600 }}>
          <iframe
            src={thread.riveUrls[0]}
            className="h-full w-full border-0"
            allowFullScreen
          />
        </div>

        {/* Metadata */}
        <div className="mt-6">
          <h1 className="font-sans font-bold text-xl text-foreground leading-snug">
            {thread.title}
          </h1>

          {isOwner && (
            <div className="mt-2">
              <RivePostActions
                threadId={thread.id}
                initialTitle={thread.title}
                initialUrl={thread.riveUrls[0]}
                initialBody={thread.body}
                initialPreviewUrl={thread.imageUrls[0] ?? ""}
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/${thread.user.username}`}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className={`h-6 w-6 overflow-hidden rounded-full flex items-center justify-center shrink-0 ${thread.user.avatarUrl ? 'bg-muted' : 'bg-spring-green'}`}>
                {thread.user.avatarUrl ? (
                  <Image
                    src={thread.user.avatarUrl}
                    alt={thread.user.displayName}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-sans font-bold text-[9px] text-foreground">
                    {thread.user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-sans text-xs font-medium text-foreground/60">
                {thread.user.displayName}
              </span>
            </Link>
            <span className="font-sans text-xs text-foreground/30">{timeAgo(thread.createdAt)}</span>
          </div>

          {thread.body && (
            <p className="mt-4 font-sans text-sm text-foreground/70 leading-relaxed max-w-2xl">
              {thread.body}
            </p>
          )}

          <div className="mt-5">
            <ThreadLikeButton
              threadId={thread.id}
              initialLiked={!!threadLike}
              initialCount={thread.likeCount}
              initialLikedBy={threadLikedBy.map((l) => l.user)}
            />
          </div>
        </div>

        {/* Comments */}
        <div className="mt-10 border-t border-border pt-8">
          <CommentSection
            threadId={id}
            initialComments={commentsWithVotes}
            currentUserId={currentUser?.id}
          />
        </div>

      </div>
    </div>
  )
}
