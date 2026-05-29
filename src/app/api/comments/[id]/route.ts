import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const comment = await prisma.comment.findUnique({ where: { id }, select: { userId: true } })
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (comment.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: "Body is required" }, { status: 400 })

  const updated = await prisma.comment.update({
    where: { id },
    data: { body: body.trim() },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const comment = await prisma.comment.findUnique({ where: { id }, select: { userId: true } })
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (comment.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Delete replies first to satisfy the self-referential NoAction FK
  await prisma.comment.deleteMany({ where: { parentCommentId: id } })
  await prisma.comment.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
