import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  const jobs = await prisma.job.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { title, company, location, type, description, applyEmail } = await req.json()
  if (!title?.trim() || !company?.trim() || !type || !description?.trim() || !applyEmail?.trim()) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const job = await prisma.job.create({
    data: {
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,
      type,
      description: description.trim(),
      applyEmail: applyEmail?.trim() || null,
      userId: user.id,
    },
  })

  return NextResponse.json(job, { status: 201 })
}
