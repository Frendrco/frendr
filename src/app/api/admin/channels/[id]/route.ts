import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const { id } = await params
  await prisma.channel.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
