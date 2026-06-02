import Image from "next/image"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { FollowButton } from "@/components/common/FollowButton"

export default async function FrendsPage() {
  const { userId: clerkId } = await auth()

  const members = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      openToWork: true,
      _count: { select: { videos: true, followers: true } },
    },
  })

  let currentUserId: string | null = null
  let followingIds = new Set<string>()

  if (clerkId && members.length > 0) {
    const currentUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (currentUser) {
      currentUserId = currentUser.id
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUser.id, followingId: { in: members.map(m => m.id) } },
        select: { followingId: true },
      })
      followingIds = new Set(follows.map(f => f.followingId))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-12">

        <div className="mb-10">
          <h1 className="display-sm text-core-black">Frends</h1>
          <p className="mt-2 font-sans text-sm text-foreground/50">
            {members.length} creator{members.length === 1 ? "" : "s"} on Frendr
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {members.map(member => {
            const initials = member.displayName
              .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
            const isOwn = currentUserId === member.id

            return (
              <div key={member.id} className="flex flex-col items-center gap-2">
                <Link href={`/${member.username}`} className="group w-full">
                  <div className="relative w-full overflow-hidden rounded-3xl bg-spring-green aspect-square transition-opacity group-hover:opacity-90">
                    {member.avatarUrl ? (
                      <Image src={member.avatarUrl} alt={member.displayName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-sans font-bold text-xl text-core-black">{initials}</span>
                      </div>
                    )}
                    {member.openToWork && (
                      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                        <span className="rounded-full bg-spring-green px-2 py-0.5 font-sans text-[9px] font-medium text-core-black">
                          Open to work
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex w-full flex-col items-center gap-1 text-center">
                  <Link
                    href={`/${member.username}`}
                    className="font-sans font-semibold text-xs text-core-black hover:underline leading-tight line-clamp-1 w-full"
                  >
                    {member.displayName}
                  </Link>
                  {member.role && (
                    <p className="font-sans text-[10px] text-foreground/40 line-clamp-1 w-full">{member.role}</p>
                  )}
                  {!isOwn && (
                    <FollowButton
                      username={member.username}
                      initialIsFollowing={followingIds.has(member.id)}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
