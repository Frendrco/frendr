import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ImportClient } from "./ImportClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Import — frendr" }

export default async function ImportPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true },
  })
  if (!user) redirect("/onboarding")

  return <ImportClient username={user.username} />
}
