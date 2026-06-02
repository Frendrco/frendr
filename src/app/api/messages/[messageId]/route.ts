import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ messageId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { messageId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true } })
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (message.senderId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.message.delete({ where: { id: messageId } })
  return new NextResponse(null, { status: 204 })
}
