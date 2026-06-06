import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ChannelsClient } from "./ChannelsClient"

export const metadata: Metadata = {
  title: "Channels",
  description: "Curated collections of the best motion design and creative video.",
}

export default async function ChannelsPage() {
  const { userId: clerkId } = await auth()

  const currentUser = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { isAdmin: true } })
    : null

  const channels = await prisma.channel.findMany({
    where: { isPublic: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, name: true, slug: true, description: true,
      coverUrl: true, color: true, type: true, featured: true, sortOrder: true,
      _count: { select: { videos: true, followers: true } },
      videos: {
        take: 1,
        orderBy: { addedAt: "desc" },
        include: { video: { select: { thumbnailUrl: true, streamId: true } } },
      },
    },
  })

  const adminChannels = channels.filter((c) => c.type === "admin")
  const userChannels = channels.filter((c) => c.type === "user")

  return (
    <ChannelsClient
      adminChannels={adminChannels}
      userChannels={userChannels}
      isSignedIn={!!clerkId}
      isAdmin={currentUser?.isAdmin}
    />
  )
}
