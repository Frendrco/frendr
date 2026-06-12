import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { AdminDeleteButton } from "../AdminDeleteButton"

export default async function AdminCommentsPage() {
  await requireAdminPage()

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { username: true } },
      video: { select: { id: true, title: true } },
      thread: { select: { id: true, title: true } },
    },
  })

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-foreground mb-1">Comments</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">{comments.length} most recent</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Comment</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Author</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">On</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-sans text-sm text-foreground line-clamp-2">{c.body}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${c.user.username}`}
                    className="font-sans text-sm text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    @{c.user.username}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {c.video ? (
                    <Link
                      href={`/v/${c.video.id}`}
                      className="font-sans text-xs text-foreground/50 hover:text-foreground transition-colors line-clamp-1 max-w-[160px] block"
                    >
                      Video: {c.video.title}
                    </Link>
                  ) : c.thread ? (
                    <span className="font-sans text-xs text-foreground/50 line-clamp-1 max-w-[160px] block">
                      Thread: {c.thread.title}
                    </span>
                  ) : (
                    <span className="font-sans text-xs text-foreground/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton endpoint={`/api/admin/comments/${c.id}`} label="this comment" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {comments.length === 0 && (
          <div className="py-16 text-center font-sans text-sm text-foreground/40">No comments yet</div>
        )}
      </div>
    </div>
  )
}
