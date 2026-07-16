import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UploadClient } from "./UploadClient"
import { FREE_UPLOAD_SECONDS } from "@/lib/stripe"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Upload — frendr" }

type Props = { searchParams: Promise<{ type?: string; upgraded?: string }> }

export default async function UploadPage({ searchParams }: Props) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const [user, { type, upgraded }] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: {
        username: true,
        isPro: true,
        isAdmin: true,
        videos: { where: { duration: { not: null } }, select: { duration: true } },
      },
    }),
    searchParams,
  ])

  if (!user) redirect("/onboarding")

  // Admins get unlimited uploads, same as the upload-url endpoint exemption.
  const unlimited = user.isPro || user.isAdmin
  const uploadedSeconds = user.videos.reduce((sum, v) => sum + (v.duration ?? 0), 0)
  const isAtLimit = !unlimited && uploadedSeconds >= FREE_UPLOAD_SECONDS
  const initialType = type === "recess" ? "RECESS" : "PORTFOLIO"
  const justUpgraded = upgraded === "1"

  return (
    <UploadClient
      username={user.username}
      initialType={initialType}
      isPro={unlimited}
      uploadedSeconds={uploadedSeconds}
      freeSeconds={FREE_UPLOAD_SECONDS}
      isAtLimit={isAtLimit}
      justUpgraded={justUpgraded}
    />
  )
}
