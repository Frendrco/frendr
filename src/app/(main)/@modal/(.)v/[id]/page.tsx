import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VideoModal } from "./VideoModal"

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
    redirect(`/v/${id}`)
  }

  // Any non-public, password-gated, or missing video — fall through to full page
  if (!video || video.visibility !== "PUBLIC" || video.password) {
    redirect(`/v/${video?.slug ?? id}`)
  }

  return <VideoModal video={video} />
}
