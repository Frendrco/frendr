import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const threadSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().max(10000).optional(),
  tags: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
  riveUrls: z.array(z.string()).optional(),
  source: z.string().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get("sort") ?? "recent"

  const threads = await prisma.thread.findMany({
    where: { source: "community" },
    orderBy: sort === "top" ? { voteCount: "desc" } : { createdAt: "desc" },
    take: 50,
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

  const raw = await req.json()
  const parsed = threadSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const { title, body, tags, videoUrl, imageUrls, riveUrls, source } = parsed.data
  const hasRive = Array.isArray(riveUrls) && riveUrls.some((u: string) => u?.trim())
  if (!title.trim() || (!body?.trim() && !hasRive)) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
  }

  const thread = await prisma.thread.create({
    data: {
      title: title.trim(),
      body: body?.trim() ?? "",
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
