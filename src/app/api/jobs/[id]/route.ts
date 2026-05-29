import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const job = await prisma.job.findUnique({ where: { id }, select: { userId: true } })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (job.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { title, company, location, type, description, applyEmail } = await req.json()
  if (!title?.trim() || !company?.trim() || !type || !description?.trim()) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const updated = await prisma.job.update({
    where: { id },
    data: {
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,
      type,
      description: description.trim(),
      applyEmail: applyEmail?.trim() || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const job = await prisma.job.findUnique({ where: { id }, select: { userId: true } })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (job.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.job.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
