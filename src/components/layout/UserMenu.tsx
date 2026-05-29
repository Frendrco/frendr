import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { UserMenuDropdown } from "./UserMenuDropdown"

export async function UserMenu() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true, displayName: true },
  })

  if (user) {
    return <UserMenuDropdown username={user.username} displayName={user.displayName} />
  }

  // Signed in with Clerk but no DB record yet (pre-onboarding) — fall back to Clerk profile
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkId)
  const displayName =
    clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
      : (clerkUser.emailAddresses[0]?.emailAddress ?? "User")

  return <UserMenuDropdown username="" displayName={displayName} />
}
