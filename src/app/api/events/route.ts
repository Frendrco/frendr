import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { title, description, date, location, onlineUrl, maxAttendees, lgbtqFriendly } = await req.json()
  if (!title?.trim() || !description?.trim() || !date) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      location: location?.trim() || null,
      onlineUrl: onlineUrl?.trim() || null,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      lgbtqFriendly: lgbtqFriendly === true,
      userId: user.id,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
