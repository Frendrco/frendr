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
// GET /api/channels?mine=true&videoId={id}  — returns user's managed channels with inChannel flag
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mine = searchParams.get("mine") === "true"

  if (mine) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const videoId = searchParams.get("videoId") ?? undefined

    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { userId: user.id },
          { admins: { some: { userId: user.id } } },
        ],
      },
      include: {
        videos: videoId ? { where: { videoId } } : false,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      channels.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color,
        inChannel: Array.isArray(c.videos) && c.videos.length > 0,
      }))
    )
  }

  const type = searchParams.get("type")
  const q = searchParams.get("q")?.trim()

  const channels = await prisma.channel.findMany({
    where: {
      isPublic: true,
      ...(type && type !== "all" ? { type } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    take: 48,
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

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, description, isPublic, type, coverUrl, color, admins } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Only admins can create admin channels
  if (type === "admin" && !user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const baseSlug = slugify(name)
  let slug = baseSlug
  let counter = 1
  while (await prisma.channel.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  // For admin channels, place at the end of the current order
  let sortOrder = 0
  if (type === "admin") {
    const last = await prisma.channel.findFirst({
      where: { type: "admin" },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    })
    sortOrder = (last?.sortOrder ?? -1) + 1
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
      sortOrder,
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
