import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"
import { VoteButtons } from "../../community/VoteButtons"
import { CommentSection } from "../../community/[threadId]/CommentSection"

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

  const [threadVote, comments] = await Promise.all([
    currentUser
      ? prisma.threadVote.findUnique({
          where: { userId_threadId: { userId: currentUser.id, threadId: id } },
        })
      : null,
    prisma.comment.findMany({
      where: { threadId: id, parentCommentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    }),
  ])

  const allCommentIds = [
    ...comments.map((c) => c.id),
    ...comments.flatMap((c) => c.replies.map((r) => r.id)),
  ]
  const commentVotes =
    currentUser && allCommentIds.length > 0
      ? await prisma.commentVote.findMany({
          where: { userId: currentUser.id, commentId: { in: allCommentIds } },
        })
      : []
  const commentVoteMap = new Map(commentVotes.map((v) => [v.commentId, v.value as 1 | -1]))

  const commentsWithVotes = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    userVote: (commentVoteMap.get(c.id) ?? 0) as 1 | -1 | 0,
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      userVote: (commentVoteMap.get(r.id) ?? 0) as 1 | -1 | 0,
    })),
  }))

  return (
    <div className="min-h-screen bg-white">
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
          <h1 className="font-sans font-bold text-xl text-core-black leading-snug">
            {thread.title}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/${thread.user.username}`}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className="h-6 w-6 overflow-hidden rounded-full bg-spring-green flex items-center justify-center shrink-0">
                {thread.user.avatarUrl ? (
                  <Image
                    src={thread.user.avatarUrl}
                    alt={thread.user.displayName}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-sans font-bold text-[9px] text-core-black">
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
            <VoteButtons
              threadId={thread.id}
              initialCount={thread.voteCount}
              initialVote={(threadVote?.value ?? 0) as 1 | -1 | 0}
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
