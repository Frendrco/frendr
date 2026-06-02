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
  const { isAdmin } = await req.json()

  if (typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin },
    select: { id: true, isAdmin: true },
  })

  return NextResponse.json(user)
}
