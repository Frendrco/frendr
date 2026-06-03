import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { RiveGrid } from "./RiveGrid"

export default async function RiveWorldPage() {
  const threads = await prisma.thread.findMany({
    where: { riveUrls: { isEmpty: false } },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id:        true,
      title:     true,
      riveUrls:  true,
      voteCount: true,
      createdAt: true,
      user:      { select: { username: true, displayName: true, avatarUrl: true } },
      _count:    { select: { comments: true } },
    },
  })

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="bg-bloom-lavender">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="display-sm text-core-black">Rive World</h1>
            <p className="mt-2 font-sans text-sm text-core-black/60">
              Interactive work from the community. Hover to play.
            </p>
          </div>
          <Link
            href="/community/new"
            className="inline-flex h-10 w-fit items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80 shrink-0"
          >
            Share Rive
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">
        <RiveGrid threads={threads} />
      </div>

    </div>
  )
}
