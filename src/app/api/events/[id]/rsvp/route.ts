import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id: eventId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const existing = await prisma.eventRsvp.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  })

  if (existing) {
    await prisma.eventRsvp.delete({ where: { id: existing.id } })
    return NextResponse.json({ attending: false })
  }

  await prisma.eventRsvp.create({ data: { userId: user.id, eventId } })
  return NextResponse.json({ attending: true })
}
