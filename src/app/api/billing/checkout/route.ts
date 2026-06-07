import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, displayName: true, stripeCustomerId: true, isPro: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (user.isPro) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
  }

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name:  user.displayName,
      metadata: { userId: user.id, clerkId },
    })
    customerId = customer.id
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/upload?upgraded=1`,
    cancel_url:  `${baseUrl}/dashboard/upload`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
