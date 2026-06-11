import { prisma } from "@/lib/prisma"
import { VideoModal } from "./VideoModal"
import { GatedModal } from "./GatedModal"

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
    return <GatedModal href={`/v/${id}`} />
  }

  const fullHref = `/v/${video?.slug ?? id}`

  // Non-public, password-gated, or missing — show a gated modal with a link
  // to the full page. Auto-redirect loops because the URL is already /v/[id].
  if (!video || video.visibility !== "PUBLIC" || video.password) {
    return <GatedModal href={fullHref} />
  }

  return <VideoModal video={video} />
}
