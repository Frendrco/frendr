import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UploadClient } from "./UploadClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Upload — frendr" }

type Props = { searchParams: Promise<{ type?: string }> }

export default async function UploadPage({ searchParams }: Props) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const [user, { type }] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId }, select: { username: true } }),
    searchParams,
  ])

  if (!user) redirect("/onboarding")

  const initialType = type === "recess" ? "RECESS" : "PORTFOLIO"

  return <UploadClient username={user.username} initialType={initialType} />
}
