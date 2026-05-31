import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const event = await prisma.event.findUnique({ where: { id }, select: { userId: true } })
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (event.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.event.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
