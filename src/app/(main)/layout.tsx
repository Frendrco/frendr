import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { UserMenu } from "@/components/layout/UserMenu"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header userMenu={<UserMenu />} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
