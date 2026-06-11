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

  return <VideoModal video={video} />
}
