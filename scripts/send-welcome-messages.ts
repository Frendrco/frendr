import { prisma } from "../src/lib/prisma"
import { sendWelcomeMessage } from "../src/lib/sendWelcomeMessage"

async function main() {
  const sender = await prisma.user.findFirst({
    where: { email: "ryan@frendr.co" },
    select: { id: true },
  })
  if (!sender) {
    console.error("Ryan's account not found in DB — aborting")
    process.exit(1)
  }

  const users = await prisma.user.findMany({
    where: { NOT: { email: "ryan@frendr.co" } },
    select: { id: true, displayName: true },
  })

  console.log(`Sending welcome messages to ${users.length} users...`)

  for (const user of users) {
    await sendWelcomeMessage(user)
    console.log(`  ✓ ${user.displayName}`)
  }

  console.log("Done.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
