import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET /api/channels?type=admin|user&q=search
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")
  const q = req.nextUrl.searchParams.get("q")?.trim()

  const channels = await prisma.channel.findMany({
    where: {
      isPublic: true,
      ...(type && type !== "all" ? { type } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { videos: true, followers: true } },
      user: { select: { username: true, displayName: true } },
    },
  })

  return NextResponse.json(channels)
}

// POST /api/channels — create a channel
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, role: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, description, isPublic, type, coverUrl, color, admins } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Only admins can create admin channels
  if (type === "admin" && user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const baseSlug = slugify(name)
  let slug = baseSlug
  let counter = 1
  while (await prisma.channel.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const channel = await prisma.channel.create({
    data: {
      name: name.trim(),
      slug,
      description,
      isPublic: isPublic !== false,
      type: type === "admin" ? "admin" : "user",
      coverUrl: coverUrl ?? null,
      color: color ?? null,
      userId: user.id,
    },
  })

  // Add any extra admins (exclude owner — they already control the channel)
  if (Array.isArray(admins) && admins.length > 0) {
    const adminIds = (admins as string[]).filter((id) => id !== user.id)
    if (adminIds.length > 0) {
      await prisma.channelAdmin.createMany({
        data: adminIds.map((userId) => ({ channelId: channel.id, userId })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(channel, { status: 201 })
}
