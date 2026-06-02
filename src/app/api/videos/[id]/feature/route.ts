import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const video = await prisma.video.findUnique({ where: { id }, select: { featured: true } })
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.video.update({
    where: { id },
    data: { featured: !video.featured },
  })

  return NextResponse.json({ featured: updated.featured })
}
