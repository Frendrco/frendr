import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export async function requireAdminPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!user || user.role !== "admin") redirect("/")

  return user
}

export async function requireAdminApi() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!user || user.role !== "admin") return null

  return user
}

export function adminUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
}
