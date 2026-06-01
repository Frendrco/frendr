import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { role: true } })
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const channel = await prisma.channel.findUnique({ where: { id }, select: { featured: true } })
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.channel.update({
    where: { id },
    data: { featured: !channel.featured },
    select: { featured: true },
  })

  revalidatePath("/")
  return NextResponse.json({ featured: updated.featured })
}
