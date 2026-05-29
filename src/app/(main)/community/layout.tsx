import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { CommunityNav } from "./CommunityNav"

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-white">

      {/* Hero banner */}
      <div className="w-full h-52 md:h-72 bg-gradient-to-br from-bloom-lavender via-sky-blue to-winter-green" />

      <div className="mx-auto max-w-screen-md px-4 md:px-6">

        <div className="flex items-end justify-between py-10">
          <div>
            <h1 className="display-sm text-core-black">Frend Zone</h1>
            <p className="mt-1 font-sans text-sm text-foreground/50">
              Connect with animators and motion designers from around the world.
            </p>
          </div>
          {userId && (
            <Link
              href="/community/new"
              className="inline-flex h-9 items-center rounded-full bg-core-black px-5 font-sans font-medium text-sm text-white transition-colors hover:bg-core-black/80"
            >
              New Thread
            </Link>
          )}
        </div>

        <CommunityNav />

        <div className="py-8">{children}</div>

      </div>
    </div>
  )
}
