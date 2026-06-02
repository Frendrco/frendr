import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ActivityPing } from "@/components/common/ActivityPing"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Frendr — Real craft. Real community.",
    template: "%s | Frendr",
  },
  description:
    "The new home for creative video. Discover, share, and showcase your best work.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen flex flex-col antialiased">
          <TooltipProvider>
            <ActivityPing />
            {children}
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
