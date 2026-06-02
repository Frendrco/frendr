import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const channel = await prisma.channel.findUnique({
    where: { id },
    select: { id: true, userId: true, user: { select: { clerkId: true } } },
  })

  if (!channel || channel.user?.clerkId !== clerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { revoke } = await req.json().catch(() => ({})) as { revoke?: boolean }

  const updated = await prisma.channel.update({
    where: { id },
    data: { shareToken: revoke ? null : crypto.randomUUID() },
    select: { shareToken: true },
  })

  return NextResponse.json({ shareToken: updated.shareToken })
}
