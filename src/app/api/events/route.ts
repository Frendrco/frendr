import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const eventSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(10000),
  date: z.string().datetime({ offset: true }),
  location: z.string().max(200).optional().nullable(),
  onlineUrl: z.string().url().optional().nullable(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  lgbtqFriendly: z.boolean().optional(),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const raw = await req.json()
  const parsed = eventSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const { title, description, date, location, onlineUrl, maxAttendees, lgbtqFriendly } = parsed.data

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      location: location?.trim() || null,
      onlineUrl: onlineUrl?.trim() || null,
      maxAttendees: maxAttendees ?? null,
      lgbtqFriendly: lgbtqFriendly === true,
      userId: user.id,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
