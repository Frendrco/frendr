import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

  await prisma.pushSubscription.deleteMany({ where: { endpoint } })

  return NextResponse.json({ ok: true })
}
