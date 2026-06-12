import Image from "next/image"
import Link from "next/link"
import { requireAdminPage } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { AdminDeleteButton } from "../AdminDeleteButton"
import { AdminRoleButton } from "./AdminRoleButton"

export default async function AdminUsersPage() {
  const me = await requireAdminPage()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isAdmin: true,
      email: true,
      createdAt: true,
      _count: { select: { videos: true, followers: true } },
    },
  })

  return (
    <div>
      <h1 className="font-sans font-bold text-2xl text-foreground mb-1">Users</h1>
      <p className="font-sans text-sm text-foreground/40 mb-8">{users.length} most recent</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">User</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50 hidden md:table-cell">Stats</th>
              <th className="px-4 py-3 text-left font-sans font-medium text-xs text-foreground/50">Role</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                      {u.avatarUrl && (
                        <Image src={u.avatarUrl} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/${u.username}`}
                        className="font-sans text-sm font-medium text-foreground hover:underline block"
                      >
                        {u.displayName}
                      </Link>
                      <p className="font-sans text-xs text-foreground/40">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-sans text-xs text-foreground/50">
                    {u._count.videos} videos · {u._count.followers} followers
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AdminRoleButton userId={u.id} isAdmin={u.isAdmin} isSelf={u.id === me.id} />
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me.id && (
                    <AdminDeleteButton endpoint={`/api/admin/users/${u.id}`} label={`@${u.username}`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-16 text-center font-sans text-sm text-foreground/40">No users yet</div>
        )}
      </div>
    </div>
  )
}
