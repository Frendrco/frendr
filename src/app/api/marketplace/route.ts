import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { name, shopUrl, category, description } = await req.json()
  if (!name?.trim() || !shopUrl?.trim()) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const shop = await prisma.shop.upsert({
    where: { userId: user.id },
    update: {
      name: name.trim(),
      shopUrl: shopUrl.trim(),
      category: category?.trim() || null,
      description: description?.trim() || null,
    },
    create: {
      name: name.trim(),
      shopUrl: shopUrl.trim(),
      category: category?.trim() || null,
      description: description?.trim() || null,
      userId: user.id,
    },
  })

  return NextResponse.json(shop, { status: 201 })
}

export async function DELETE(_req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.shop.deleteMany({ where: { userId: user.id } })

  return new NextResponse(null, { status: 204 })
}
