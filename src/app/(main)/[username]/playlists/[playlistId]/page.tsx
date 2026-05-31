import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { ChevronLeft, Lock, Globe } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoCard } from "@/components/common/VideoCard"
import { PlaylistDetailActions } from "./PlaylistDetailActions"

type Props = { params: Promise<{ username: string; playlistId: string }> }

export default async function PlaylistDetailPage({ params }: Props) {
  const { username, playlistId } = await params
  const { userId: clerkId } = await auth()

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, clerkId: true, displayName: true },
  })
  if (!user) notFound()

  const isOwn = clerkId === user.clerkId

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      videos: {
        orderBy: { position: "asc" },
        include: {
          video: {
            include: {
              user: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  })

  if (!playlist || playlist.userId !== user.id) notFound()
  if (!playlist.isPublic && !isOwn) notFound()

  const videos = playlist.videos.map((pv) => pv.video)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        {/* Back */}
        <Link
          href={`/${username}/playlists`}
          className="mb-6 inline-flex items-center gap-1.5 font-sans text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          {user.displayName}&apos;s playlists
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-sans font-bold text-2xl text-core-black">{playlist.name}</h1>
              {playlist.isPublic ? (
                <Globe size={14} className="text-foreground/30" />
              ) : (
                <Lock size={14} className="text-foreground/30" />
              )}
            </div>
            {playlist.description && (
              <p className="font-sans text-sm text-foreground/50">{playlist.description}</p>
            )}
            <p className="mt-1 font-sans text-xs text-foreground/40">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
          </div>

          {isOwn && (
            <PlaylistDetailActions
              playlist={{
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                isPublic: playlist.isPublic,
              }}
              username={username}
            />
          )}
        </div>

        {/* Videos */}
        {videos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="font-sans font-semibold text-base text-core-black">No videos yet</p>
            <p className="font-sans text-sm text-foreground/40">
              {isOwn ? "Hover over any video to save it here." : "This playlist is empty."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} showTimestamp />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
