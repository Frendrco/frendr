import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ActivityPing } from "@/components/common/ActivityPing"
import { ServiceWorkerRegistrar } from "@/components/common/ServiceWorkerRegistrar"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"),
  title: {
    default: "Frendr — Real craft. Real community.",
    template: "%s | Frendr",
  },
  description:
    "The new home for creative video. Discover, share, and showcase your best work.",
  openGraph: {
    siteName: "Frendr",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning style={{ backgroundColor: "#ffffff" }}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="preload" href="/fonts/205TF-Louize-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <link rel="preload" href="/fonts/205TF-Louize-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <link rel="preload" href="/fonts/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        </head>
        <body className="min-h-screen flex flex-col antialiased">
          <TooltipProvider>
            <ActivityPing />
            <ServiceWorkerRegistrar />
            {children}
            <Analytics />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
