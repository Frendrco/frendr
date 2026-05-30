import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/playlists/[id]/videos/[videoId] — remove video from playlist
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, videoId } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const playlist = await prisma.playlist.findUnique({ where: { id } })
  if (!playlist || playlist.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.playlistVideo.deleteMany({
    where: { playlistId: id, videoId },
  })

  return NextResponse.json({ ok: true })
}
