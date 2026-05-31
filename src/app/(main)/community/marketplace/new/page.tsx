import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ShopForm } from "../ShopForm"

export default async function NewShopPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div>
      <Link
        href="/community/marketplace"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Marketplace
      </Link>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-xl text-core-black">List Your Shop</h2>
        <p className="mt-1 font-sans text-sm text-foreground/50">Let the community discover your presets, templates, merch, and more.</p>
      </div>

      <ShopForm />
    </div>
  )
}
