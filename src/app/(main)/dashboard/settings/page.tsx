import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./SettingsClient"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings — frendr" }

export default async function SettingsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      username:    true,
      displayName: true,
      avatarUrl:   true,
      location:    true,
      age:         true,
      bio:         true,
      website:     true,
      role:        true,
      pronouns:    true,
      creatorType: true,
      instagram:   true,
      linkedin:    true,
      patreon:     true,
      substack:    true,
      playlist:    true,
      behance:     true,
      other:       true,
      tags:        true,
      emailNotifyMessages: true,
      emailNotifyComments: true,
      emailNotifyReplies:  true,
      emailNotifyFollows:   true,
      emailNotifyTrending:  true,
    },
  })

  if (!user) redirect("/onboarding")

  return <SettingsClient profile={user} />
}
