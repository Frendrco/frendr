import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import slugify from "slugify"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName, location, age, tags } = await req.json()
  if (!displayName || typeof displayName !== "string") {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 })
  }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const avatarUrl = clerkUser.imageUrl ?? null

  const base = slugify(displayName, { lower: true, strict: true })
  const suffix = Math.floor(1000 + Math.random() * 9000)
  const username = `${base}${suffix}`

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

  const { displayName, location, age, bio, website, role, instagram, linkedin, twitter, tags, openToWork, coverImageUrl } = await req.json()

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const avatarUrl = clerkUser.imageUrl ?? null

  const user = await prisma.user.update({
    where: { clerkId: userId },
    data: {
      avatarUrl,
      ...(displayName && { displayName }),
      location: location ?? null,
      age: age ? Number(age) : null,
      bio: bio ?? null,
      website: website ?? null,
      role: role ?? null,
      instagram: instagram ?? null,
      linkedin: linkedin ?? null,
      twitter: twitter ?? null,
      ...(Array.isArray(tags) && { tags }),
      ...(typeof openToWork === "boolean" && { openToWork }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl ?? null }),
    },
  })

  return NextResponse.json(user)
}
