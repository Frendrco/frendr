import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VideoEditRow } from "./VideoEditRow"

export default async function MyVideosPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, username: true },
  })
  if (!user) redirect("/sign-in")

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      streamId: true,
      externalUrl: true,
      duration: true,
      visibility: true,
      videoType: true,
      tags: true,
      categories: true,
      password: true,
      hideFromFeeds: true,
      allowComments: true,
      allowDownloads: true,
      embedAutoplay: true,
      embedLoop: true,
      embedShowControls: true,
      allowEmbedding: true,
      collaborators: {
        select: {
          userId: true,
          role: true,
          status: true,
          user: { select: { username: true, displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl text-foreground">My Videos</h1>
          <p className="font-sans text-sm text-foreground/40 mt-1">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-sans text-foreground/40 mb-4">No videos yet.</p>
            <Link
              href="/dashboard/upload"
              className="inline-flex h-10 items-center px-6 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm hover:bg-spring-green/90 transition-colors"
            >
              Upload your first video
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {videos.map(video => (
              <VideoEditRow key={video.id} video={video} username={user.username} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
