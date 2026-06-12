import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { ExternalLink, ShoppingBag } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { DeleteShopButton } from "./DeleteShopButton"
import { SaveShopButton } from "./SaveShopButton"

export default async function MarketplacePage() {
  const { userId: clerkId } = await auth()

  const [shops, currentUser] = await Promise.all([
    prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { displayName: true, username: true, avatarUrl: true } } },
    }),
    clerkId ? prisma.user.findUnique({ where: { clerkId }, select: { id: true } }) : null,
  ])

  const myShop = currentUser ? shops.find(s => s.userId === currentUser.id) : null

  const savedShopIds = currentUser
    ? new Set(
        (await prisma.savedShop.findMany({
          where: { userId: currentUser.id, shopId: { in: shops.map(s => s.id) } },
          select: { shopId: true },
        })).map(s => s.shopId)
      )
    : new Set<string>()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-sans text-sm text-foreground/40">
          {shops.length === 0 ? "No shops listed yet" : `${shops.length} shop${shops.length === 1 ? "" : "s"}`}
        </p>
        {clerkId && (
          myShop ? (
            <div className="flex items-center gap-2">
              <DeleteShopButton />
              <Link
                href="/community/marketplace/edit"
                className="inline-flex h-8 items-center rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Edit My Shop
              </Link>
            </div>
          ) : (
            <Link
              href="/community/marketplace/new"
              className="inline-flex h-8 items-center rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              + List My Shop
            </Link>
          )
        )}
      </div>

      {shops.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ShoppingBag size={32} className="text-foreground/20" />
          <p className="font-sans font-medium text-sm text-foreground">No shops listed yet</p>
          <p className="font-sans text-sm text-foreground/40">Got presets, templates, or merch? List your shop here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map(shop => (
            <div key={shop.id} className="rounded-2xl border border-border p-5 flex flex-col gap-4 hover:border-foreground/20 transition-colors">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-spring-green/20">
                  {shop.user.avatarUrl ? (
                    <Image src={shop.user.avatarUrl} alt={shop.user.displayName} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-sans font-bold text-xs text-foreground">
                      {shop.user.displayName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <Link href={`/${shop.user.username}`} className="font-sans font-semibold text-sm text-foreground hover:underline truncate block">
                    {shop.name}
                  </Link>
                  <p className="font-sans text-xs text-foreground/40">by {shop.user.displayName}</p>
                </div>
              </div>

              {shop.category && (
                <span className="self-center sm:self-start inline-flex h-6 items-center rounded-full bg-foreground/[0.06] px-3 font-sans text-[11px] font-medium text-foreground/60">
                  {shop.category}
                </span>
              )}

              {shop.description && (
                <p className="font-sans text-xs text-foreground/50 leading-relaxed line-clamp-3">{shop.description}</p>
              )}

              <div className="mt-auto flex items-center gap-2">
                <a
                  href={shop.shopUrl.startsWith("http") ? shop.shopUrl : `https://${shop.shopUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-core-black px-5 font-sans font-medium text-xs text-white transition-colors hover:bg-core-black/80"
                >
                  Visit Shop <ExternalLink size={11} />
                </a>
                {currentUser && shop.userId !== currentUser.id && (
                  <SaveShopButton shopId={shop.id} initialSaved={savedShopIds.has(shop.id)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
