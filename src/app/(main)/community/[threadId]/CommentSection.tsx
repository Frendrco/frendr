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

interface ReplyData {
  id: string
  body: string
  userId: string
  voteCount: number
  createdAt: string | Date
  user: CommentUser
  userVote: 1 | -1 | 0
}

interface CommentData {
  id: string
  body: string
  userId: string
  voteCount: number
  createdAt: string | Date
  user: CommentUser
  userVote: 1 | -1 | 0
  replies: ReplyData[]
}

interface Props {
  threadId: string
  initialComments: CommentData[]
  currentUserId?: string
}

function Avatar({ user, size }: { user: CommentUser; size: number }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full flex items-center justify-center ${user.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}
      style={{ width: size, height: size }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.displayName} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="font-sans font-bold text-foreground" style={{ fontSize: size * 0.4 }}>
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
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
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

function InlineEditForm({ initialBody, onSave, onCancel }: {
  initialBody: string
  onSave: (newBody: string) => void
  onCancel: () => void
}) {
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!body.trim() || saving) return
    setSaving(true)
    onSave(body.trim())
  }

  return (
    <div className="flex flex-col gap-2 mt-1.5">
      <textarea
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!body.trim() || saving || body.trim() === initialBody.trim()}
          className="h-8 rounded-full bg-core-black px-4 font-sans font-medium text-xs text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

export function CommentSection({ threadId, initialComments, currentUserId }: Props) {
  const { isSignedIn } = useAuth()
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)

  function addTopLevelComment(comment: CommentData) {
    setComments(prev => [comment, ...prev])
  }

  function addReply(parentId: string, reply: CommentData) {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
    setReplyingTo(null)
  }

  async function saveCommentEdit(commentId: string, newBody: string, isReply: boolean, parentId?: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody }),
    })
    if (!res.ok) return
    setEditingComment(null)
    if (isReply && parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, body: newBody } : r) }
          : c
      ))
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, body: newBody } : c))
    }
  }

  async function deleteComment(commentId: string, isReply: boolean, parentId?: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
    if (!res.ok) return
    if (isReply && parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies.filter(r => r.id !== commentId) }
          : c
      ))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-sans font-semibold text-sm text-foreground">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {isSignedIn ? (
        <CommentForm threadId={threadId} onSubmit={addTopLevelComment} />
      ) : (
        <p className="font-sans text-sm text-foreground/40">
          <Link href="/sign-in" className="underline hover:text-foreground transition-colors">Sign in</Link> to join the discussion.
        </p>
      )}

      <div className="flex flex-col divide-y divide-border">
        {comments.map(comment => (
          <div key={comment.id} className="py-5">
            <div className="flex items-start gap-3">
              <Avatar user={comment.user} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/${comment.user.username}`} className="font-sans font-semibold text-xs text-foreground hover:underline">
                    {comment.user.displayName}
                  </Link>
                  <span className="font-sans text-xs text-foreground/30">{timeAgo(comment.createdAt)}</span>
                </div>

                {editingComment === comment.id ? (
                  <InlineEditForm
                    initialBody={comment.body}
                    onSave={newBody => saveCommentEdit(comment.id, newBody, false)}
                    onCancel={() => setEditingComment(null)}
                  />
                ) : (
                  <p className="mt-1.5 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                )}

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
                        replyingTo === comment.id ? "text-foreground" : "text-foreground/40 hover:text-foreground"
                      )}
                    >
                      Reply
                    </button>
                  )}
                  {currentUserId && comment.userId === currentUserId && editingComment !== comment.id && (
                    <>
                      <button
                        onClick={() => setEditingComment(comment.id)}
                        className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(comment.id, false)}
                        className="font-sans text-xs text-foreground/40 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

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

                {comment.replies.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4 border-l-2 border-border pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <Avatar user={reply.user} size={22} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/${reply.user.username}`} className="font-sans font-semibold text-xs text-foreground hover:underline">
                              {reply.user.displayName}
                            </Link>
                            <span className="font-sans text-xs text-foreground/30">{timeAgo(reply.createdAt)}</span>
                          </div>

                          {editingComment === reply.id ? (
                            <InlineEditForm
                              initialBody={reply.body}
                              onSave={newBody => saveCommentEdit(reply.id, newBody, true, comment.id)}
                              onCancel={() => setEditingComment(null)}
                            />
                          ) : (
                            <p className="mt-1 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {reply.body}
                            </p>
                          )}

                          <div className="mt-1.5 flex items-center gap-3">
                            <VoteButtons
                              commentId={reply.id}
                              initialCount={reply.voteCount}
                              initialVote={reply.userVote}
                            />
                            {currentUserId && reply.userId === currentUserId && editingComment !== reply.id && (
                              <>
                                <button
                                  onClick={() => setEditingComment(reply.id)}
                                  className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteComment(reply.id, true, comment.id)}
                                  className="font-sans text-xs text-foreground/40 hover:text-red-500 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
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
