import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

async function fetchRiveOGImage(riveUrl: string): Promise<string | null> {
  try {
    const shareUrl = riveUrl.replace(/\/embed$/, "")
    const res = await fetch(shareUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

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

  // Auto-fetch OG thumbnail from rive.app for Rive World posts
  let resolvedImageUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : []
  if (source === "rive_world" && riveUrls?.[0] && resolvedImageUrls.length === 0) {
    const ogImage = await fetchRiveOGImage(riveUrls[0])
    if (ogImage) resolvedImageUrls = [ogImage]
  }

  const thread = await prisma.thread.create({
    data: {
      title: title.trim(),
      body: body?.trim() ?? "",
      tags: Array.isArray(tags) ? tags : [],
      videoUrl: videoUrl?.trim() || null,
      imageUrls: resolvedImageUrls,
      riveUrls: Array.isArray(riveUrls) ? riveUrls.filter(Boolean) : [],
      source: source === "rive_world" ? "rive_world" : "community",
      userId: user.id,
    },
  })

  return NextResponse.json(thread, { status: 201 })
}
