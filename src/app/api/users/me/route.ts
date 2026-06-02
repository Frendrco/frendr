import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.user.delete({ where: { clerkId } })

  return NextResponse.json({ ok: true })
}
