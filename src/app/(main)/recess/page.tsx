import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { RecessGrid } from "./RecessGrid"
import { RecessSearchInput } from "./RecessSearchInput"

type Props = { searchParams: Promise<{ q?: string }> }

export default async function RecessPage({ searchParams }: Props) {
  const { q = "" } = await searchParams
  const query = q.trim()

  const videos = await prisma.video.findMany({
    where: {
      isPublic: true,
      videoType: "RECESS",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { user: { displayName: { contains: query, mode: "insensitive" } } },
              { tags: { hasSome: [query] } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  })

  const mapped = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    streamId: v.streamId,
    externalUrl: v.externalUrl,
    tags: v.tags,
    likeCount: v._count.likes,
    user: v.user,
  }))

  return (
    <div className="min-h-screen bg-white text-core-black">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">

        {/* Header */}
        <div className="pt-8 pb-6 border-b border-border">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left gap-3">
            <div>
              <h1 className="font-sans font-bold text-2xl text-core-black">Recess</h1>
              <p className="mt-1 font-sans text-sm text-foreground/40">Making things for the fun of it</p>
            </div>
            <Link
              href="/dashboard/upload?type=recess"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-spring-green px-4 font-sans font-medium text-sm text-core-black transition-colors hover:bg-core-black hover:text-white"
            >
              + Drop something
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="py-5">
          <RecessSearchInput defaultValue={query} />
        </div>

        {/* Results */}
        {mapped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            {query ? (
              <>
                <p className="font-sans font-semibold text-sm text-core-black">No results for &ldquo;{query}&rdquo;</p>
                <p className="font-sans text-sm text-foreground/40">Try a different title, creator, or tool name.</p>
              </>
            ) : (
              <>
                <p className="font-sans font-semibold text-sm text-core-black">Nothing here yet</p>
                <p className="font-sans text-sm text-foreground/40">Be the first to drop something.</p>
              </>
            )}
          </div>
        ) : (
          <div className="pb-16">
            {query && (
              <p className="mb-5 font-sans text-sm text-foreground/40">
                {mapped.length} result{mapped.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
            )}
            <RecessGrid videos={mapped} />
          </div>
        )}

      </div>
    </div>
  )
}
