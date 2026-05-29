import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ username: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { username } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [followerUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ])

  if (!followerUser) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 })
  if (followerUser.id === targetUser.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: followerUser.id, followingId: targetUser.id } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
  } else {
    await prisma.follow.create({
      data: { followerId: followerUser.id, followingId: targetUser.id },
    })
  }

  const followerCount = await prisma.follow.count({ where: { followingId: targetUser.id } })

  return NextResponse.json({ following: !existing, followerCount })
}
