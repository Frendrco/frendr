import Image from "next/image"
import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { AdminDeleteButton } from "../AdminDeleteButton"

export default async function AdminVideosPage() {
  await requireAdminPage()

  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { username: true, displayName: true } },
      _count: { select: { comments: true, likes: true } },
    },
  })

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-core-black mb-1">Videos</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">{videos.length} most recent</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Video</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Creator</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">Stats</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">Visibility</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {v.thumbnailUrl && (
                        <Image src={v.thumbnailUrl} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <Link
                      href={`/v/${v.id}`}
                      className="font-sans text-sm text-core-black hover:underline line-clamp-1 max-w-[200px]"
                    >
                      {v.title}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${v.user.username}`}
                    className="font-sans text-sm text-foreground/70 hover:text-core-black transition-colors"
                  >
                    @{v.user.username}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-sans text-xs text-foreground/50">
                    {v._count.likes} likes · {v._count.comments} comments
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-sans text-xs font-medium ${
                    v.isPublic ? "bg-green-50 text-green-700" : "bg-muted text-foreground/50"
                  }`}>
                    {v.isPublic ? "Public" : "Private"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton endpoint={`/api/admin/videos/${v.id}`} label="this video" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && (
          <div className="py-16 text-center font-sans text-sm text-foreground/40">No videos yet</div>
        )}
      </div>
    </div>
  )
}
