import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get("sort") ?? "recent"

  const threads = await prisma.thread.findMany({
    where: { source: "community" },
    orderBy: sort === "top" ? { voteCount: "desc" } : { createdAt: "desc" },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
  })

  return NextResponse.json(threads)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { title, body, tags, videoUrl, imageUrls, riveUrls, source } = await req.json()
  const hasRive = Array.isArray(riveUrls) && riveUrls.some((u: string) => u?.trim())
  if (!title?.trim() || (!body?.trim() && !hasRive)) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
  }

  const thread = await prisma.thread.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      tags: Array.isArray(tags) ? tags : [],
      videoUrl: videoUrl?.trim() || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [],
      riveUrls: Array.isArray(riveUrls) ? riveUrls.filter(Boolean) : [],
      source: source === "rive_world" ? "rive_world" : "community",
      userId: user.id,
    },
  })

  return NextResponse.json(thread, { status: 201 })
}
