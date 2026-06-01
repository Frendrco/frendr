import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const { id } = await params
  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const { id } = await params
  const { role } = await req.json()

  if (!["admin", ""].includes(role ?? "")) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: role || null },
    select: { id: true, role: true },
  })

  return NextResponse.json(user)
}
