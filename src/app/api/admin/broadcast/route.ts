import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const body = await req.json() as { message?: string }
  const message = body.message?.trim()
  if (!message || message.length > 500) {
    return NextResponse.json({ error: "Message must be 1–500 characters." }, { status: 400 })
  }

  const users = await prisma.user.findMany({ select: { id: true } })

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "announcement",
      message,
    })),
  })

  return NextResponse.json({ count: users.length })
}
