import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, lastActiveAt: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const stale = !user.lastActiveAt || now.getTime() - user.lastActiveAt.getTime() > 5 * 60 * 1000
  if (stale) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: now } })
  }

  return NextResponse.json({ ok: true })
}
