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

  const collab = await prisma.videoCollaborator.findUnique({ where: { id } })
  if (!collab) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (collab.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { action } = await req.json() as { action: "accept" | "decline" }
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const status = action === "accept" ? "ACCEPTED" : "DECLINED"
  await prisma.videoCollaborator.update({ where: { id }, data: { status } })

  await prisma.notification.updateMany({
    where: { contentId: id, contentType: "credit_request", userId: user.id },
    data: { read: true },
  })

  return NextResponse.json({ ok: true, status })
}
