import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { VideoModal } from "./VideoModal"
import { HardRedirect } from "./HardRedirect"

type Props = { params: Promise<{ id: string }> }

export default async function InterceptedVideoPage({ params }: Props) {
  const { id } = await params

  let video
  try {
    video = await prisma.video.findFirst({
      where: { OR: [{ slug: id }, { id }] },
      select: {
        id: true,
        slug: true,
        title: true,
        streamId: true,
        externalUrl: true,
        thumbnailUrl: true,
        tags: true,
        viewCount: true,
        visibility: true,
        password: true,
        _count: { select: { likes: true } },
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })
  } catch {
    return <HardRedirect href={`/v/${id}`} />
  }

  // Non-public, password-gated, or missing — hard navigate to full page
  if (!video || video.visibility !== "PUBLIC" || video.password) {
    return <HardRedirect href={`/v/${video?.slug ?? id}`} />
  }

  // Check if the current user has liked this video
  const { userId: clerkId } = await auth()
  let initialUpvoted = false
  if (clerkId) {
    const dbUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (dbUser) {
      const like = await prisma.videoLike.findUnique({
        where: { videoId_userId: { videoId: video.id, userId: dbUser.id } },
      })
      initialUpvoted = !!like
    }
  }

  return <VideoModal video={video} initialUpvoted={initialUpvoted} />
}
