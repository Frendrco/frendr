import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { Lock, Globe } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PlaylistCardActions } from "./PlaylistCardActions"

type Props = { params: Promise<{ username: string }> }

export default async function PlaylistsPage({ params }: Props) {
  const { username } = await params
  const { userId: clerkId } = await auth()

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, clerkId: true },
  })
  if (!user) notFound()

  const isOwn = clerkId === user.clerkId

  const playlists = await prisma.playlist.findMany({
    where: {
      userId: user.id,
      ...(isOwn ? {} : { isPublic: true, isDefault: false }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      videos: {
        take: 4,
        orderBy: { position: "asc" },
        include: { video: { select: { thumbnailUrl: true } } },
      },
      _count: { select: { videos: true } },
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        {/* Profile tab header */}
        <div className="mb-8 border-b border-border pb-0">
          <div className="flex gap-6 justify-center sm:justify-start">
            <Link
              href={`/${username}`}
              scroll={false}
              className="pb-3 font-sans font-medium text-sm border-b-2 border-transparent text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Videos
            </Link>
            <Link
              href={`/${username}?tab=recess`}
              scroll={false}
              className="pb-3 font-sans font-medium text-sm border-b-2 border-transparent text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Recess
            </Link>
            <Link
              href={`/${username}?tab=interactive`}
              scroll={false}
              className="pb-3 font-sans font-medium text-sm border-b-2 border-transparent text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Interactive
            </Link>
            <Link
              href={`/${username}?tab=playlists`}
              scroll={false}
              className="pb-3 font-sans font-medium text-sm border-b-2 border-core-black text-core-black"
            >
              Playlists
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-sans font-bold text-sm text-core-black">
            Playlists
            {playlists.length > 0 && (
              <span className="ml-2 font-normal text-foreground/40">({playlists.length})</span>
            )}
          </h2>
        </div>

        {playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="font-sans font-semibold text-base text-core-black">No playlists yet</p>
            <p className="font-sans text-sm text-foreground/40">
              {isOwn ? "Hover over any video and click the bookmark icon to save it to a playlist." : "This creator hasn't made any public playlists."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((pl) => (
              <div key={pl.id} className="group relative flex flex-col gap-2">

                {/* Thumbnail — links to detail page */}
                <Link href={`/${username}/playlists/${pl.id}`} className="relative block aspect-video overflow-hidden rounded-xl bg-mist-grey">
                  {pl.videos.length === 0 ? (
                    <div className="h-full w-full bg-mist-grey" />
                  ) : pl.videos.length === 1 ? (
                    pl.videos[0].video.thumbnailUrl ? (
                      <Image
                        src={pl.videos[0].video.thumbnailUrl}
                        alt={pl.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : <div className="h-full w-full bg-mist-grey" />
                  ) : (
                    <div className="grid grid-cols-2 h-full">
                      {pl.videos.slice(0, 4).map((pv, i) => (
                        <div key={i} className="relative overflow-hidden">
                          {pv.video.thumbnailUrl ? (
                            <Image src={pv.video.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 25vw, 17vw" className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-mist-grey" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Private badge */}
                  {!pl.isPublic && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                      <Lock size={9} className="text-white" />
                      <span className="font-sans text-[9px] text-white">Private</span>
                    </div>
                  )}
                </Link>

                {/* 3-dot actions overlay (owner only) */}
                {isOwn && (
                  <PlaylistCardActions
                    playlist={{
                      id: pl.id,
                      name: pl.name,
                      description: pl.description,
                      isPublic: pl.isPublic,
                      isDefault: pl.isDefault,
                    }}
                    username={username}
                  />
                )}

                {/* Meta */}
                <div>
                  <Link href={`/${username}/playlists/${pl.id}`}>
                    <p className="font-sans font-medium text-sm text-core-black leading-snug line-clamp-1 hover:underline">{pl.name}</p>
                  </Link>
                  <p className="font-sans text-xs text-foreground/40">
                    {pl._count.videos} {pl._count.videos === 1 ? "video" : "videos"}
                    {pl.isPublic ? (
                      <> · <Globe size={9} className="inline mb-0.5" /> Public</>
                    ) : (
                      <> · <Lock size={9} className="inline mb-0.5" /> Private</>
                    )}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
