import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { DiscoverGrid } from "./DiscoverGrid"

export const metadata: Metadata = {
  title: "Discover · Frendr",
  description: "Browse portfolio videos from motion designers, animators, and video creators.",
}

export default async function DiscoverPage() {
  const videos = await prisma.video.findMany({
    where: { visibility: "PUBLIC", hideFromFeeds: false, videoType: "PORTFOLIO" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  })

  const mapped = videos.map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    streamId: v.streamId,
    externalUrl: v.externalUrl,
    featured: v.featured,
    tags: v.tags,
    categories: v.categories,
    createdAt: v.createdAt.toISOString(),
    likeCount: v._count.likes,
    user: {
      username: v.user.username,
      displayName: v.user.displayName,
      avatarUrl: v.user.avatarUrl,
    },
  }))

  return (
    <div className="min-h-screen bg-white text-core-black">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">

        {/* Header */}
        <div className="pt-8 pb-6 border-b border-border">
          <h1 className="font-sans font-bold text-2xl text-core-black">Discover</h1>
          <p className="mt-1 font-sans text-sm text-foreground/40">Browse all portfolio work from the community</p>
        </div>

        <div className="pt-6 pb-16">
          <DiscoverGrid videos={mapped} />
        </div>

      </div>
    </div>
  )
}
