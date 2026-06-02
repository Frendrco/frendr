import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend, FROM, buildDigestEmail } from "@/lib/email"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const unsent = await prisma.notificationQueue.findMany({
    where: { sent: false },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          emailNotifyMessages: true,
          emailNotifyComments: true,
          emailNotifyReplies:  true,
          emailNotifyFollows:  true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  if (unsent.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Group by user
  const byUser = new Map<string, typeof unsent>()
  for (const item of unsent) {
    const list = byUser.get(item.userId) ?? []
    list.push(item)
    byUser.set(item.userId, list)
  }

  const prefKey: Record<string, "emailNotifyMessages" | "emailNotifyComments" | "emailNotifyReplies" | "emailNotifyFollows"> = {
    message: "emailNotifyMessages",
    comment: "emailNotifyComments",
    reply:   "emailNotifyReplies",
    follow:  "emailNotifyFollows",
  }

  let emailsSent = 0
  const now = new Date()

  for (const [userId, items] of byUser) {
    const user = items[0].user
    const allIds = items.map(i => i.id)

    // Filter by user notification prefs
    const eligible = user.email
      ? items.filter(i => {
          const pref = prefKey[i.type]
          return pref ? user[pref] : false
        })
      : []

    if (eligible.length > 0 && resend) {
      const digestItems = eligible.map(i => ({
        type: i.type,
        data: i.data as { actorName: string; actorUsername: string | null; contentId: string | null; contentType: string | null },
      }))

      const { subject, html } = buildDigestEmail(user.displayName, digestItems)

      try {
        await resend.emails.send({ from: FROM, to: user.email!, subject, html })
        emailsSent++
      } catch {
        // Leave as unsent — will retry next run
        continue
      }
    }

    // Mark all items for this user as sent (including pref-filtered ones)
    await prisma.notificationQueue.updateMany({
      where: { id: { in: allIds } },
      data: { sent: true, sentAt: now },
    })
  }

  return NextResponse.json({ sent: emailsSent, users: byUser.size })
}
