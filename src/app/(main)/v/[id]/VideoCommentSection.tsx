"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { timeAgo, cn } from "@/lib/utils"

interface CommentUser {
  username: string
  displayName: string
  avatarUrl: string | null
}

interface ReactionData {
  emoji: string
  count: number
  reacted: boolean
}

interface ReplyData {
  id: string
  body: string
  userId: string
  voteCount: number
  createdAt: string | Date
  user: CommentUser
  userVote: 1 | -1 | 0
  likeCount: number
  liked: boolean
  likedBy: CommentUser[]
  reactions: ReactionData[]
}

export interface VideoCommentData {
  id: string
  body: string
  userId: string
  voteCount: number
  createdAt: string | Date
  user: CommentUser
  userVote: 1 | -1 | 0
  likeCount: number
  liked: boolean
  likedBy: CommentUser[]
  reactions: ReactionData[]
  replies: ReplyData[]
}

const EMOJI_PALETTE = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"]

function Avatar({ user, size }: { user: CommentUser; size: number }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full flex items-center justify-center ${user.avatarUrl ? "bg-mist-grey" : "bg-spring-green"}`}
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

function LikeButton({ commentId, initialLiked, initialCount, initialLikedBy }: {
  commentId: string
  initialLiked: boolean
  initialCount: number
  initialLikedBy: CommentUser[]
}) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [likedBy, setLikedBy] = useState(initialLikedBy)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isSignedIn) { router.push("/sign-in"); return }
    if (loading) return
    setLoading(true)
    setLiked(l => !l)
    setCount(c => liked ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setCount(data.count)
        setLikedBy(data.likedBy)
      }
    } catch {
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group flex items-center gap-1">
      <button
        onClick={toggle}
        className={cn("flex items-center gap-1 transition-colors", liked ? "text-red-400" : "text-foreground/30 hover:text-foreground/60")}
      >
        <Heart size={12} className={liked ? "fill-current" : ""} strokeWidth={2} />
        {count > 0 && <span className="font-sans text-xs tabular-nums">{count}</span>}
      </button>
      {count > 0 && (
        <div className="pointer-events-none invisible group-hover:visible absolute bottom-full left-0 mb-1.5 z-10 max-w-[160px] rounded-lg bg-core-black px-2.5 py-1.5 shadow-lg">
          <p className="font-sans text-xs text-white leading-relaxed">
            {likedBy.slice(0, 5).map(u => u.displayName).join(", ")}
            {count > 5 ? ` +${count - 5} more` : ""}
          </p>
        </div>
      )}
    </div>
  )
}

function EmojiReactions({ commentId, initialReactions }: {
  commentId: string
  initialReactions: ReactionData[]
}) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [reactions, setReactions] = useState(initialReactions)
  const [showPicker, setShowPicker] = useState(false)

  async function react(emoji: string) {
    if (!isSignedIn) { router.push("/sign-in"); return }
    setShowPicker(false)
    setReactions(prev => {
      const ex = prev.find(r => r.emoji === emoji)
      if (ex) {
        if (ex.reacted) {
          return ex.count <= 1 ? prev.filter(r => r.emoji !== emoji) : prev.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r)
        }
        return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r)
      }
      return [...prev, { emoji, count: 1, reacted: true }]
    })
    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      })
      if (res.ok) setReactions(await res.json())
    } catch {
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => react(r.emoji)}
          className={cn(
            "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
            r.reacted ? "border-spring-green/40 bg-spring-green/10 text-core-black" : "border-border text-foreground/60 hover:border-foreground/30"
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-sans text-[10px] font-medium tabular-nums">{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => isSignedIn ? setShowPicker(s => !s) : router.push("/sign-in")}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-foreground/30 hover:border-foreground/30 hover:text-foreground transition-colors text-xs"
          title="Add reaction"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-0.5 rounded-xl border border-border bg-white p-1.5 shadow-lg">
            {EMOJI_PALETTE.map(emoji => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-mist-grey transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentForm({ videoId, parentCommentId, isReply, onSubmit, onCancel }: {
  videoId: string
  parentCommentId?: string
  isReply?: boolean
  onSubmit: (comment: VideoCommentData) => void
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
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), parentCommentId }),
    })
    if (res.ok) {
      const comment = await res.json()
      onSubmit({ ...comment, replies: comment.replies ?? [] })
      setBody("")
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        rows={isReply ? 1 : 2}
        className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-base md:text-sm text-core-black placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-spring-green"
        placeholder={isReply ? "Write a reply…" : "Add a comment…"}
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex shrink-0 items-center justify-end gap-2">
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
          {submitting ? "Posting…" : isReply ? "Reply" : "Post"}
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

  return (
    <div className="flex flex-col gap-2 mt-1.5">
      <textarea
        rows={2}
        autoFocus
        className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-sans text-base md:text-sm text-core-black focus:outline-none focus:ring-2 focus:ring-spring-green"
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex shrink-0 items-center justify-end gap-2">
        <button onClick={onCancel} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">Cancel</button>
        <button
          onClick={() => onSave(body.trim())}
          disabled={!body.trim() || body.trim() === initialBody.trim()}
          className="h-8 rounded-full bg-core-black px-4 font-sans font-medium text-xs text-white transition-colors hover:bg-core-black/80 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export function VideoCommentSection({ videoId, initialComments, currentUserId }: {
  videoId: string
  initialComments: VideoCommentData[]
  currentUserId?: string
}) {
  const { isSignedIn } = useAuth()
  const [comments, setComments] = useState<VideoCommentData[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  function addTop(comment: VideoCommentData) {
    setComments(prev => [...prev, comment])
  }

  // parentId is always the top-level comment id (flat threading)
  function addReply(parentId: string, reply: VideoCommentData) {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
    setReplyingTo(null)
  }

  async function saveEdit(commentId: string, newBody: string, parentId?: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody }),
    })
    if (!res.ok) return
    setEditingId(null)
    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, body: newBody } : r) }
          : c
      ))
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, body: newBody } : c))
    }
  }

  async function deleteComment(commentId: string, parentId?: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
    if (!res.ok) return
    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c
      ))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-sans font-semibold text-sm text-core-black">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {isSignedIn ? (
        <CommentForm videoId={videoId} onSubmit={addTop} />
      ) : (
        <p className="font-sans text-sm text-foreground/40">
          <Link href="/sign-in" className="underline hover:text-foreground transition-colors">Sign in</Link> to leave a comment.
        </p>
      )}

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

                {editingId === comment.id ? (
                  <InlineEditForm
                    initialBody={comment.body}
                    onSave={newBody => saveEdit(comment.id, newBody)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <p className="mt-1.5 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <LikeButton
                    commentId={comment.id}
                    initialLiked={comment.liked}
                    initialCount={comment.likeCount}
                    initialLikedBy={comment.likedBy}
                  />
                  {isSignedIn && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className={cn("font-sans text-xs transition-colors", replyingTo === comment.id ? "text-core-black" : "text-foreground/40 hover:text-foreground")}
                    >
                      Reply
                    </button>
                  )}
                  {currentUserId === comment.userId && editingId !== comment.id && (
                    <>
                      <button onClick={() => setEditingId(comment.id)} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">Edit</button>
                      <button onClick={() => deleteComment(comment.id)} className="font-sans text-xs text-foreground/40 hover:text-red-500 transition-colors">Delete</button>
                    </>
                  )}
                </div>

                <div className="mt-2">
                  <EmojiReactions commentId={comment.id} initialReactions={comment.reactions} />
                </div>

                {replyingTo === comment.id && (
                  <div className="mt-3">
                    <CommentForm
                      videoId={videoId}
                      parentCommentId={comment.id}
                      isReply
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
                            <Link href={`/${reply.user.username}`} className="font-sans font-semibold text-xs text-core-black hover:underline">
                              {reply.user.displayName}
                            </Link>
                            <span className="font-sans text-xs text-foreground/30">{timeAgo(reply.createdAt)}</span>
                          </div>

                          {editingId === reply.id ? (
                            <InlineEditForm
                              initialBody={reply.body}
                              onSave={newBody => saveEdit(reply.id, newBody, comment.id)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <p className="mt-1 font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                          )}

                          <div className="mt-1.5 flex items-center gap-3">
                            <LikeButton
                              commentId={reply.id}
                              initialLiked={reply.liked}
                              initialCount={reply.likeCount}
                              initialLikedBy={reply.likedBy}
                            />
                            {isSignedIn && (
                              <button
                                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                                className={cn("font-sans text-xs transition-colors", replyingTo === reply.id ? "text-core-black" : "text-foreground/40 hover:text-foreground")}
                              >
                                Reply
                              </button>
                            )}
                            {currentUserId === reply.userId && editingId !== reply.id && (
                              <>
                                <button onClick={() => setEditingId(reply.id)} className="font-sans text-xs text-foreground/40 hover:text-foreground transition-colors">Edit</button>
                                <button onClick={() => deleteComment(reply.id, comment.id)} className="font-sans text-xs text-foreground/40 hover:text-red-500 transition-colors">Delete</button>
                              </>
                            )}
                          </div>

                          <div className="mt-1.5">
                            <EmojiReactions commentId={reply.id} initialReactions={reply.reactions} />
                          </div>

                          {replyingTo === reply.id && (
                            <div className="mt-3">
                              <CommentForm
                                videoId={videoId}
                                parentCommentId={comment.id}
                                isReply
                                onSubmit={newReply => addReply(comment.id, newReply)}
                                onCancel={() => setReplyingTo(null)}
                              />
                            </div>
                          )}
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
