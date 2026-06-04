import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const [updated] = await prisma.$transaction([
    prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: user.id },
      data: { lastReadAt: new Date() },
    }),
    prisma.notification.updateMany({
      where: { userId: user.id, type: "message", contentId: id, read: false },
      data: { read: true },
    }),
  ])

  if (updated.count === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json({ ok: true })
}
