import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi, adminUnauthorized } from "@/lib/admin"
import { resend, FROM, buildAnnouncementEmail } from "@/lib/email"

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin) return adminUnauthorized()

  const body = await req.json() as { message?: string; subject?: string; sendEmail?: boolean }
  const message   = body.message?.trim()
  const subject   = body.subject?.trim()
  const sendEmail = body.sendEmail === true

  if (!message || message.length > 5000) {
    return NextResponse.json({ error: "Message must be 1–5000 characters." }, { status: 400 })
  }
  if (sendEmail && !subject) {
    return NextResponse.json({ error: "Subject is required when sending email." }, { status: 400 })
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } })

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "announcement",
      message: message.slice(0, 500),
    })),
  })

  let emailCount = 0
  if (sendEmail && subject && resend) {
    const { html } = buildAnnouncementEmail(subject, message)
    const emails = users.map(u => u.email).filter((e): e is string => !!e)

    // Resend supports up to 50 recipients per batch call
    const BATCH = 50
    for (let i = 0; i < emails.length; i += BATCH) {
      const chunk = emails.slice(i, i + BATCH)
      await resend.emails.send({
        from: FROM,
        to: chunk,
        subject,
        html,
      })
      emailCount += chunk.length
    }
  }

  return NextResponse.json({ count: users.length, emailCount })
}
