import { auth } from "@clerk/nextjs/server"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { UserMenu } from "@/components/layout/UserMenu"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  return (
    <>
      <Header isSignedIn={!!userId} userMenu={userId ? <UserMenu /> : undefined} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
