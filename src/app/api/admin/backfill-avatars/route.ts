import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { pickDefaultAvatar } from "@/lib/defaultAvatars"

export const maxDuration = 60

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  const isAdminSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isAdminSecret) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { isAdmin: true } })
    if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const clerk = await clerkClient()

  // Page through all Clerk users
  let offset = 0
  const limit = 100
  let updated = 0
  let skipped = 0

  while (true) {
    const { data: clerkUsers } = await clerk.users.getUserList({ limit, offset })
    if (clerkUsers.length === 0) break

    for (const clerkUser of clerkUsers) {
      if (clerkUser.hasImage) { skipped++; continue }

      await prisma.user.updateMany({
        where: {
          clerkId: clerkUser.id,
          // Only replace if they don't already have one of our custom defaults
          NOT: {
            avatarUrl: { startsWith: "/images/ava-" }
          },
        },
        data: { avatarUrl: pickDefaultAvatar() },
      })
      updated++
    }

    if (clerkUsers.length < limit) break
    offset += limit
  }

  return NextResponse.json({ updated, skipped })
}
