import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"
import { VoteButtons } from "../VoteButtons"
import { ThreadActions } from "./ThreadActions"
import { CommentSection } from "./CommentSection"
import { ThreadEmbeds } from "./ThreadEmbeds"
import { MarkdownBody } from "./MarkdownBody"

type Props = { params: Promise<{ threadId: string }> }

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params
  const { userId: clerkId } = await auth()

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true, role: true } },
    },
  })
  if (!thread) notFound()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  const isOwner = currentUser?.id === thread.userId

  const [threadVote, comments] = await Promise.all([
    currentUser
      ? prisma.threadVote.findUnique({ where: { userId_threadId: { userId: currentUser.id, threadId } } })
      : null,
    prisma.comment.findMany({
      where: { threadId, parentCommentId: null },
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

  // Fetch comment votes for current user
  const allCommentIds = [
    ...comments.map(c => c.id),
    ...comments.flatMap(c => c.replies.map(r => r.id)),
  ]
  const commentVotes = currentUser && allCommentIds.length > 0
    ? await prisma.commentVote.findMany({ where: { userId: currentUser.id, commentId: { in: allCommentIds } } })
    : []
  const commentVoteMap = new Map(commentVotes.map(v => [v.commentId, v.value as 1 | -1]))

  const commentsWithVotes = comments.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    userVote: (commentVoteMap.get(c.id) ?? 0) as 1 | -1 | 0,
    replies: c.replies.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      userVote: (commentVoteMap.get(r.id) ?? 0) as 1 | -1 | 0,
    })),
  }))

  return (
    <div>
      <Link
        href="/community"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Community
      </Link>

      {/* Thread */}
      <div className="mb-10">
        <h2 className="font-sans font-bold text-xl text-core-black leading-snug">{thread.title}</h2>

        <div className="mt-3 flex items-center gap-3">
          <Link href={`/${thread.user.username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="h-6 w-6 overflow-hidden rounded-full bg-spring-green flex items-center justify-center shrink-0">
              {thread.user.avatarUrl ? (
                <Image src={thread.user.avatarUrl} alt={thread.user.displayName} width={24} height={24} className="h-full w-full object-cover" />
              ) : (
                <span className="font-sans font-bold text-[9px] text-core-black">
                  {thread.user.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-sans text-xs font-medium text-foreground/60">{thread.user.displayName}</span>
          </Link>
          <span className="font-sans text-xs text-foreground/30">{timeAgo(thread.createdAt)}</span>
          {isOwner && (
            <div className="ml-auto">
              <ThreadActions threadId={thread.id} />
            </div>
          )}
        </div>

        {thread.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {thread.tags.map(tag => (
              <span key={tag} className="rounded-full border border-border px-2.5 py-0.5 font-sans text-[10px] text-foreground/40">
                {tag}
              </span>
            ))}
          </div>
        )}

        <MarkdownBody body={thread.body} />

        <ThreadEmbeds videoUrl={thread.videoUrl} imageUrls={thread.imageUrls} riveUrls={thread.riveUrls} />

        <div className="mt-5">
          <VoteButtons
            threadId={thread.id}
            initialCount={thread.voteCount}
            initialVote={(threadVote?.value ?? 0) as 1 | -1 | 0}
          />
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <CommentSection threadId={threadId} initialComments={commentsWithVotes} currentUserId={currentUser?.id} />
      </div>
    </div>
  )
}
