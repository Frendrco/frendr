import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, description, isPublic } = await req.json()
  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (playlist.isDefault)
    return NextResponse.json({ error: "Cannot delete default playlists" }, { status: 400 })

  await prisma.playlist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
