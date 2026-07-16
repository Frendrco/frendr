import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { UserMenuDropdown } from "./UserMenuDropdown"

export async function UserMenu() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true, displayName: true, avatarUrl: true },
  })

  // Onboarded user: everything comes from the DB. Only hit Clerk's Backend API
  // (rate-limited) as a fallback when the local avatar is missing.
  if (user) {
    let avatarUrl = user.avatarUrl ?? undefined
    if (!avatarUrl) {
      const client = await clerkClient()
      avatarUrl = (await client.users.getUser(clerkId)).imageUrl ?? undefined
    }
    return (
      <UserMenuDropdown
        username={user.username}
        displayName={user.displayName}
        avatarUrl={avatarUrl}
      />
    )
  }

  // Signed in with Clerk but no DB record yet (pre-onboarding) — fall back to Clerk profile
  const clerkUser = await (await clerkClient()).users.getUser(clerkId)
  const displayName =
    clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
      : (clerkUser.emailAddresses[0]?.emailAddress ?? "User")

  return <UserMenuDropdown username="" displayName={displayName} avatarUrl={clerkUser.imageUrl ?? undefined} />
}
