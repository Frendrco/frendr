import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ShopForm } from "../ShopForm"

export default async function EditShopPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  const shop = await prisma.shop.findUnique({ where: { userId: user.id } })
  if (!shop) redirect("/community/marketplace/new")

  return (
    <div>
      <Link
        href="/community/marketplace"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Marketplace
      </Link>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-xl text-foreground">Edit Your Shop</h2>
        <p className="mt-1 font-sans text-sm text-foreground/50">Update your shop details.</p>
      </div>

      <ShopForm initial={{
        name: shop.name,
        shopUrl: shop.shopUrl,
        category: shop.category,
        description: shop.description,
      }} />
    </div>
  )
}
