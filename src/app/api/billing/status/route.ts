import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { FREE_UPLOAD_SECONDS } from "@/lib/stripe"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, isPro: true, stripeCustomerId: true, stripeSubscriptionId: true, subscriptionStatus: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const agg = await prisma.video.aggregate({
    where: { userId: user.id, duration: { not: null } },
    _sum: { duration: true },
  })
  const uploadedSeconds = agg._sum.duration ?? 0

  let renewsAt: string | null = null
  if (user.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end
      if (periodEnd) renewsAt = new Date(periodEnd * 1000).toISOString()
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    isPro: user.isPro,
    subscriptionStatus: user.subscriptionStatus,
    uploadedSeconds,
    freeSeconds: FREE_UPLOAD_SECONDS,
    renewsAt,
  })
}
