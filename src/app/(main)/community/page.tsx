import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { MessageSquare } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"
import { VoteButtons } from "./VoteButtons"
import { SaveThreadButton } from "./SaveThreadButton"
import { DeleteThreadButton } from "./DeleteThreadButton"

type Props = { searchParams: Promise<{ sort?: string }> }

export default async function CommunityPage({ searchParams }: Props) {
  const { sort = "recent" } = await searchParams
  const { userId: clerkId } = await auth()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  const threads = await prisma.thread.findMany({
    where: { source: "community" },
    orderBy: sort === "top" ? { voteCount: "desc" } : { createdAt: "desc" },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
  })

  const threadIds = threads.map(t => t.id)
  const [userVotes, savedThreads] = await Promise.all([
    currentUser
      ? prisma.threadVote.findMany({ where: { userId: currentUser.id, threadId: { in: threadIds } } })
      : [],
    currentUser
      ? prisma.savedThread.findMany({ where: { userId: currentUser.id, threadId: { in: threadIds } }, select: { threadId: true } })
      : [],
  ])
  const voteMap = new Map(userVotes.map(v => [v.threadId, v.value as 1 | -1]))
  const savedSet = new Set(savedThreads.map(s => s.threadId))

  return (
    <div className="flex flex-col gap-0">
      {/* Sort tabs */}
      <div className="mb-6 flex gap-2">
        {(["recent", "top"] as const).map(s => (
          <Link
            key={s}
            href={`/community?sort=${s}`}
            className={[
              "inline-flex h-9 items-center rounded-full px-5 font-sans text-sm font-medium capitalize transition-colors",
              sort === s
                ? "bg-core-black text-white"
                : "border border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground",
            ].join(" ")}
          >
            {s === "recent" ? "New" : "Top"}
          </Link>
        ))}
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-medium text-sm text-core-black">No threads yet</p>
          <p className="font-sans text-sm text-foreground/40">Be the first to start a discussion.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {threads.map(thread => (
            <div key={thread.id} className="flex items-start gap-5 py-7">
              {/* Vote */}
              <div className="mt-1 shrink-0">
                <VoteButtons
                  threadId={thread.id}
                  initialCount={thread.voteCount}
                  initialVote={voteMap.get(thread.id) ?? 0}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <Link href={`/community/${thread.id}`} className="group">
                  <p className="font-sans font-semibold text-base text-core-black group-hover:underline leading-snug">
                    {thread.title}
                  </p>
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {/* Author */}
                  <Link href={`/${thread.user.username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div className={`h-5 w-5 overflow-hidden rounded-full shrink-0 flex items-center justify-center ${thread.user.avatarUrl ? 'bg-mist-grey' : 'bg-spring-green'}`}>
                      {thread.user.avatarUrl ? (
                        <Image src={thread.user.avatarUrl} alt={thread.user.displayName} width={20} height={20} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-sans font-bold text-[8px] text-core-black">
                          {thread.user.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-sm text-foreground/50">{thread.user.displayName}</span>
                  </Link>

                  <span className="font-sans text-sm text-foreground/30">{timeAgo(thread.createdAt)}</span>

                  <Link href={`/community/${thread.id}`} className="flex items-center gap-1.5 text-foreground/30 hover:text-foreground/60 transition-colors">
                    <MessageSquare size={13} />
                    <span className="font-sans text-sm">{thread._count.comments}</span>
                  </Link>
                  {currentUser && (
                    <SaveThreadButton threadId={thread.id} initialSaved={savedSet.has(thread.id)} />
                  )}
                  {currentUser?.id === thread.userId && (
                    <DeleteThreadButton threadId={thread.id} />
                  )}
                </div>

                {/* Tags */}
                {thread.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {thread.tags.map(tag => (
                      <span key={tag} className="rounded-full border border-border px-2.5 py-0.5 font-sans text-xs text-foreground/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
