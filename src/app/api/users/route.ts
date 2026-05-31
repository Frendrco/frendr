import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import slugify from "slugify"
import { prisma } from "@/lib/prisma"

const USERNAME_RE = /^[a-z0-9-]{3,30}$/

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName, username: rawUsername, location, age, tags } = await req.json()
  if (!displayName || typeof displayName !== "string") {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 })
  }

  const username = rawUsername ?? slugify(displayName, { lower: true, strict: true })
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing && existing.clerkId !== userId) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 })
  }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const avatarUrl = clerkUser.imageUrl ?? null

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { displayName, avatarUrl, location: location || null, age: age ? Number(age) : null, tags: Array.isArray(tags) ? tags : [] },
    create: { clerkId: userId, username, displayName, avatarUrl, location: location || null, age: age ? Number(age) : null, tags: Array.isArray(tags) ? tags : [] },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName, username, location, age, bio, website, role, instagram, linkedin, twitter, tags, openToWork, coverImageUrl } = await req.json()

  if (username !== undefined) {
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing && existing.clerkId !== userId) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }
  }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const avatarUrl = clerkUser.imageUrl ?? null

  const user = await prisma.user.update({
    where: { clerkId: userId },
    data: {
      avatarUrl,
      ...(displayName && { displayName }),
      ...(username   !== undefined && { username }),
      ...(location   !== undefined && { location:  location  ?? null }),
      ...(age        !== undefined && { age:       age ? Number(age) : null }),
      ...(bio        !== undefined && { bio:       bio       ?? null }),
      ...(website    !== undefined && { website:   website   ?? null }),
      ...(role       !== undefined && { role:      role      ?? null }),
      ...(instagram  !== undefined && { instagram: instagram ?? null }),
      ...(linkedin   !== undefined && { linkedin:  linkedin  ?? null }),
      ...(twitter    !== undefined && { twitter:   twitter   ?? null }),
      ...(Array.isArray(tags) && { tags }),
      ...(typeof openToWork === "boolean" && { openToWork }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl ?? null }),
    },
  })

  return NextResponse.json(user)
}
