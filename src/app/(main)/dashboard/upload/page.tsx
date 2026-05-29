import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UploadClient } from "./UploadClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Upload — frendr" }

export default async function UploadPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true },
  })

  if (!user) redirect("/onboarding")

  return <UploadClient username={user.username} />
}
