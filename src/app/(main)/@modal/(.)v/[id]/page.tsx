import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VideoModal } from "./VideoModal"

type Props = { params: Promise<{ id: string }> }

export default async function InterceptedVideoPage({ params }: Props) {
  const { id } = await params

  const video = await prisma.video.findFirst({
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

  if (!video) notFound()

  // For private/password-gated videos, send to the full page
  if (video.visibility !== "PUBLIC" || video.password) {
    redirect(`/v/${video.slug ?? video.id}`)
  }

  return <VideoModal video={video} />
}
