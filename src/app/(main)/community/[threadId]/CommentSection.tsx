"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { timeAgo, cn } from "@/lib/utils"
import { VoteButtons } from "../VoteButtons"

interface CommentUser {
  username: string
  displayName: string
  avatarUrl: string | null
}

interface CommentData {
  id: string
  body: string
  voteCount: number
  createdAt: string | Date
  user: CommentUser
  userVote: 1 | -1 | 0
  replies: Array<{
    id: string
    body: string
    voteCount: number
    createdAt: string | Date
    user: CommentUser
    userVote: 1 | -1 | 0
  }>
}

interface Props {
  threadId: string
  initialComments: CommentData[]
}

function Avatar({ user, size }: { user: CommentUser; size: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-spring-green flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.displayName} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="font-sans font-bold text-core-black" style={{ fontSize: size * 0.4 }}>
          {user.displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function CommentForm({ threadId, parentCommentId, onSubmit, onCancel }: {
  threadId: string
  parentCommentId?: string
  onSubmit: (comment: CommentData) => void
  onCancel?: () => void
}) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting) return
    if (!isSignedIn) { router.push("/sign-in"); return }

    setSubmitting(true)
    const res = await fetch(`/api/threads/${threadId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), parentCommentId }),
    })

    if (res.ok) {
      const comment = await res.json()
      onSubmit({ ...comment, userVote: 0, replies: comment.replies ?? [] })
      setBody("")
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        rows={3}
        className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
        placeholder="Write a reply…"
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="h-8 rounded-full bg-core-black px-4 font-sans font-medium text-xs text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting…" : "Reply"}
        </button>
      </div>
    </form>
  )
}

export function CommentSection({ threadId, initialComments }: Props) {
  const { isSignedIn } = useAuth()
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  function addTopLevelComment(comment: CommentData) {
    setComments(prev => [comment, ...prev])
  }

  function addReply(parentId: string, reply: CommentData) {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
    setReplyingTo(null)
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-sans font-semibold text-sm text-core-black">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {/* Top-level comment form */}
      {isSignedIn ? (
        <CommentForm threadId={threadId} onSubmit={addTopLevelComment} />
      ) : (
        <p className="font-sans text-sm text-foreground/40">
          <Link href="/sign-in" className="underline hover:text-foreground transition-colors">Sign in</Link> to join the discussion.
        </p>
      )}

      {/* Comment list */}
      <div className="flex flex-col divide-y divide-border">
        {comments.map(comment => (
          <div key={comment.id} className="py-5">
            <div className="flex items-start gap-3">
              <Avatar user={comment.user} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/${comment.user.username}`} className="font-sans font-semibold text-xs text-core-black hover:underline">
                    {comment.user.displayName}
                  </Link>
                  <span className="font-sans text-xs text-foreground/30">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="mt-1.5 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {comment.body}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <VoteButtons
                    commentId={comment.id}
                    initialCount={comment.voteCount}
                    initialVote={comment.userVote}
                  />
                  {isSignedIn && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className={cn(
                        "font-sans text-xs transition-colors",
                        replyingTo === comment.id ? "text-core-black" : "text-foreground/40 hover:text-foreground"
                      )}
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-3">
                    <CommentForm
                      threadId={threadId}
                      parentCommentId={comment.id}
                      onSubmit={reply => addReply(comment.id, reply)}
                      onCancel={() => setReplyingTo(null)}
                    />
                  </div>
                )}

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4 border-l-2 border-border pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <Avatar user={reply.user} size={22} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/${reply.user.username}`} className="font-sans font-semibold text-xs text-core-black hover:underline">
                              {reply.user.displayName}
                            </Link>
                            <span className="font-sans text-xs text-foreground/30">{timeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="mt-1 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {reply.body}
                          </p>
                          <div className="mt-1.5">
                            <VoteButtons
                              commentId={reply.id}
                              initialCount={reply.voteCount}
                              initialVote={reply.userVote}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
