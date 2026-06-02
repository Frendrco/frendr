import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      fromUser: { select: { displayName: true, username: true, avatarUrl: true } },
    },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await req.json().catch(() => ({}))

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } })
  } else {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.notification.deleteMany({ where: { userId: user.id } })

  return NextResponse.json({ ok: true })
}
