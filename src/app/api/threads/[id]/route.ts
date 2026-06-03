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

  const thread = await prisma.thread.findUnique({ where: { id }, select: { userId: true } })
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (thread.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { title, body, tags, videoUrl, imageUrls, riveUrls } = await req.json()
  const hasRive = Array.isArray(riveUrls) && riveUrls.some((u: string) => u?.trim())
  if (!title?.trim() || (!body?.trim() && !hasRive)) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
  }

  const updated = await prisma.thread.update({
    where: { id },
    data: {
      title: title.trim(),
      body: body.trim(),
      tags: Array.isArray(tags) ? tags : [],
      videoUrl: videoUrl?.trim() || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [],
      riveUrls: Array.isArray(riveUrls) ? riveUrls.filter(Boolean) : [],
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const thread = await prisma.thread.findUnique({ where: { id }, select: { userId: true } })
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (thread.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Delete replies first to satisfy the self-referential NoAction FK on comments
  await prisma.comment.deleteMany({ where: { threadId: id, parentCommentId: { not: null } } })
  await prisma.thread.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
