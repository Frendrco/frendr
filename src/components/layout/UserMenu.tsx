import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { UserMenuDropdown } from "./UserMenuDropdown"

export async function UserMenu() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkId)

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true, displayName: true, avatarUrl: true },
  })

  const avatarUrl = user?.avatarUrl ?? clerkUser.imageUrl ?? undefined

  if (user) {
    return (
      <UserMenuDropdown
        username={user.username}
        displayName={user.displayName}
        avatarUrl={avatarUrl}
      />
    )
  }

  // Signed in with Clerk but no DB record yet (pre-onboarding) — fall back to Clerk profile
  const displayName =
    clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
      : (clerkUser.emailAddresses[0]?.emailAddress ?? "User")

  return <UserMenuDropdown username="" displayName={displayName} avatarUrl={avatarUrl} />
}
