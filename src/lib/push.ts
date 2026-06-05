import webpush from "web-push"
import { prisma } from "@/lib/prisma"

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

type PushPayload = {
  title: string
  body: string
  url: string
  icon?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY) return

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, icon: payload.icon ?? "/images/logo-3d.png" })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, data)
        .catch(async (err: { statusCode?: number }) => {
          // 410 Gone = subscription expired; clean it up
          if (err?.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
          }
        })
    )
  )
}
