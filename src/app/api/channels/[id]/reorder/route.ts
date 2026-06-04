import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { direction } = await req.json() as { direction: "up" | "down" }

  const channels = await prisma.channel.findMany({
    where: { type: "admin" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  })

  const idx = channels.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= channels.length) {
    return NextResponse.json({ error: "Out of bounds" }, { status: 400 })
  }

  const a = channels[idx]
  const b = channels[swapIdx]

  await prisma.$transaction([
    prisma.channel.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.channel.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ])

  return NextResponse.json({ ok: true })
}
