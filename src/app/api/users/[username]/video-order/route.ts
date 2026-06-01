import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, clerkId: true },
  })
  if (!user || user.clerkId !== clerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { videoIds } = await req.json()
  if (!Array.isArray(videoIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await prisma.$transaction(
    (videoIds as string[]).map((id, index) =>
      prisma.video.update({
        where: { id, userId: user.id },
        data: { position: index },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
