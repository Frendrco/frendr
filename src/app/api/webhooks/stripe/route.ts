import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type Stripe from "stripe"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break
      const customerId     = session.customer as string
      const subscriptionId = session.subscription as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          isPro: true,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "active",
        },
      })
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const isActive = sub.status === "active" || sub.status === "trialing"
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          isPro: isActive,
          subscriptionStatus: sub.status,
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          isPro: false,
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        },
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const rawSub = (invoice as unknown as { subscription?: string | { id: string } }).subscription
      const subId = typeof rawSub === "string" ? rawSub : rawSub?.id
      if (subId) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { subscriptionStatus: "past_due" },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
