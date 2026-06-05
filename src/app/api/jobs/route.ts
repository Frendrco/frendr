import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const jobSchema = z.object({
  title: z.string().min(1).max(150),
  company: z.string().min(1).max(150),
  location: z.string().max(150).optional().nullable(),
  type: z.string().min(1),
  description: z.string().min(1).max(10000),
  applyEmail: z.string().email(),
})

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

  const raw = await req.json()
  const parsed = jobSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const { title, company, location, type, description, applyEmail } = parsed.data

  const job = await prisma.job.create({
    data: {
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,
      type,
      description: description.trim(),
      applyEmail,
      userId: user.id,
    },
  })

  return NextResponse.json(job, { status: 201 })
}
