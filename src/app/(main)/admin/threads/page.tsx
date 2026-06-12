import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { AdminDeleteButton } from "../AdminDeleteButton"

export default async function AdminThreadsPage() {
  await requireAdminPage()

  const threads = await prisma.thread.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  })

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-foreground mb-1">Threads</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">{threads.length} most recent</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Thread</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Author</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">Stats</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-sans text-sm font-medium text-foreground line-clamp-1">{t.title}</p>
                  <p className="font-sans text-xs text-foreground/40 line-clamp-1 mt-0.5">{t.body}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${t.user.username}`}
                    className="font-sans text-sm text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    @{t.user.username}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-sans text-xs text-foreground/50">
                    {t.voteCount} votes · {t._count.comments} comments
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminDeleteButton endpoint={`/api/admin/threads/${t.id}`} label="this thread" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {threads.length === 0 && (
          <div className="py-16 text-center font-sans text-sm text-foreground/40">No threads yet</div>
        )}
      </div>
    </div>
  )
}
