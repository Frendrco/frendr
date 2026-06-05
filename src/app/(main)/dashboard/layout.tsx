import { InstallBanner } from "@/components/common/InstallBanner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstallBanner />
      {children}
    </>
  )
}
