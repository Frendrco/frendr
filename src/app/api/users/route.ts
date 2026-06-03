import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import slugify from "slugify"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const USERNAME_RE = /^[a-z0-9-]{3,30}$/

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName, username: rawUsername, location, age, tags, showAiContent } = await req.json()
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
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null

  let user
  try {
    user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { displayName, avatarUrl, email, location: location || null, age: age ? Number(age) : null, tags: Array.isArray(tags) ? tags : [], ...(typeof showAiContent === "boolean" && { showAiContent }) },
      create: { clerkId: userId, username, displayName, avatarUrl, email, location: location || null, age: age ? Number(age) : null, tags: Array.isArray(tags) ? tags : [], showAiContent: typeof showAiContent === "boolean" ? showAiContent : true },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }

  // Auto-follow all admins on signup
  const admins = await prisma.user.findMany({ where: { isAdmin: true, NOT: { id: user.id } }, select: { id: true } })
  if (admins.length > 0) {
    await prisma.follow.createMany({
      data: admins.map((a) => ({ followerId: user.id, followingId: a.id })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { displayName, username, location, age, bio, website, role, instagram, linkedin, twitter, patreon, substack, playlist, behance, other, tags, openToWork, coverImageUrl, emailNotifyMessages, emailNotifyComments, emailNotifyReplies, emailNotifyFollows } = await req.json()

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
      ...(patreon    !== undefined && { patreon:   patreon   ?? null }),
      ...(substack   !== undefined && { substack:  substack  ?? null }),
      ...(playlist   !== undefined && { playlist:  playlist  ?? null }),
      ...(behance    !== undefined && { behance:   behance   ?? null }),
      ...(other      !== undefined && { other:     other     ?? null }),
      ...(Array.isArray(tags) && { tags }),
      ...(typeof openToWork           === "boolean" && { openToWork }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl ?? null }),
      ...(typeof emailNotifyMessages  === "boolean" && { emailNotifyMessages }),
      ...(typeof emailNotifyComments  === "boolean" && { emailNotifyComments }),
      ...(typeof emailNotifyReplies   === "boolean" && { emailNotifyReplies }),
      ...(typeof emailNotifyFollows   === "boolean" && { emailNotifyFollows }),
    },
  })

  return NextResponse.json(user)
}
