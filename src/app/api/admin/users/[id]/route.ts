import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const { id } = await params
  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { clerkId: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await prisma.user.delete({ where: { id } })

    // Remove from Clerk so they can't sign back in
    try {
      const clerk = await clerkClient()
      await clerk.users.deleteUser(user.clerkId)
    } catch {
      // Clerk deletion failed but DB is clean — acceptable
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Admin user delete failed:", err)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
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
