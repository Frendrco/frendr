import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { FollowButton } from "@/components/common/FollowButton"

type Props = { params: Promise<{ username: string }> }

export default async function FollowersPage({ params }: Props) {
  const { username } = await params
  const { userId: clerkId } = await auth()

  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      displayName: true,
      followers: {
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
          },
        },
      },
    },
  })
  if (!profileUser) notFound()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  // Which of these users is the current user already following?
  const followingIds = currentUser
    ? new Set(
        (await prisma.follow.findMany({
          where: {
            followerId: currentUser.id,
            followingId: { in: profileUser.followers.map(f => f.follower.id) },
          },
          select: { followingId: true },
        })).map(f => f.followingId)
      )
    : new Set<string>()

  const creators = profileUser.followers.map(f => f.follower)

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">

        <Link
          href={`/${username}`}
          className="mb-8 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft size={13} /> {profileUser.displayName}
        </Link>

        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl text-core-black">Frends</h1>
          <p className="mt-1 font-sans text-sm text-foreground/40">
            {creators.length === 0
              ? `${profileUser.displayName} has no followers yet`
              : `${creators.length} ${creators.length === 1 ? "person follows" : "people follow"} ${profileUser.displayName}`}
          </p>
        </div>

        {creators.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {creators.map(creator => {
              const isOwn = currentUser?.id === creator.id
              const initials = creator.displayName
                .split(" ")
                .map(w => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <div key={creator.id} className="flex flex-col items-center gap-2.5">
                  <Link href={`/${creator.username}`} className="group w-full">
                    <div className="relative w-full overflow-hidden rounded-3xl bg-spring-green aspect-square transition-opacity group-hover:opacity-90">
                      {creator.avatarUrl ? (
                        <Image
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-sans font-bold text-3xl text-core-black">{initials}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex w-full flex-col items-center gap-1.5 text-center">
                    <Link
                      href={`/${creator.username}`}
                      className="font-sans font-semibold text-sm text-core-black hover:underline leading-tight"
                    >
                      {creator.displayName}
                    </Link>
                    {creator.role && (
                      <p className="font-sans text-[11px] text-foreground/40 leading-none">{creator.role}</p>
                    )}
                    {!isOwn && (
                      <FollowButton
                        username={creator.username}
                        initialIsFollowing={followingIds.has(creator.id)}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
