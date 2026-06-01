import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Sparkles } from "lucide-react"
import { AdminNav } from "./AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true },
  })
  if (!user || user.role !== "admin") redirect("/")

  return (
    <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-10">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 shrink-0">
          <div className="mb-5 flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-spring-green px-3 py-1">
              <Sparkles size={11} className="text-core-black" />
              <span className="font-sans font-medium text-xs text-core-black">Admin</span>
            </div>
          </div>
          <AdminNav />
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
