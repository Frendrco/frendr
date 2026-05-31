import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: shopId } = await params
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await prisma.savedShop.findUnique({
    where: { userId_shopId: { userId: user.id, shopId } },
  })

  if (existing) {
    await prisma.savedShop.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  }

  await prisma.savedShop.create({ data: { userId: user.id, shopId } })
  return NextResponse.json({ saved: true })
}
