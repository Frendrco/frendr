import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { ThumbnailRow } from "./ThumbnailRow"

export default async function AdminThumbnailsPage() {
  await requireAdminPage()

  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { thumbnailUrl: null },
        { thumbnailUrl: "" },
        { thumbnailUrl: { contains: "image.mux.com" } },
      ],
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      user: { select: { displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-core-black mb-1">Broken Thumbnails</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">
        {videos.length} video{videos.length !== 1 ? "s" : ""} with missing or legacy thumbnails
      </p>

      {videos.length === 0 ? (
        <p className="font-sans text-sm text-foreground/50">All thumbnails look good 🎉</p>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map(video => (
            <ThumbnailRow key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
