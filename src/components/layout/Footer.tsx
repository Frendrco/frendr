import Image from "next/image"
import Link from "next/link"
import { Logo } from "@/components/common/Logo"

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/frendr.co" },
  { label: "Newsletter", href: "https://frendr.co/newsletter" },
]

const LEGAL_LINKS = [
  { label: "Terms",      href: "/terms"                  },
  { label: "Privacy",    href: "/privacy"                },
  { label: "Contact",    href: "mailto:ryan@frendr.co"   },
]

export function Footer() {
  return (
    <footer className="bg-white overflow-hidden">

      {/* ── Slim nav bar ── */}
      <div className="mx-auto max-w-screen-xl px-6 md:px-8 pt-6 pb-3 relative flex items-center justify-between border-t border-black/10">

        {/* Social links */}
        <div className="flex items-center gap-6">
          {SOCIAL_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Symbol — absolutely centered so it's independent of side widths */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 hover:scale-125 transition-transform duration-200">
          <Logo variant="symbol" height={22} colour="black" />
        </Link>

        {/* Legal links */}
        <div className="flex items-center gap-6">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-sans text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

      </div>

      {/* ── Giant logotype ── */}
      {/* SVG is 800×800 square; letters sit at y≈330–460.                               */}
      {/* At 120vw wide: letter band ≈ 19.5vw tall, starting ≈ 49.5vw from top.         */}
      {/* overflow-hidden + negative margin-top crops to just the letter region.          */}
      <div className="overflow-hidden" style={{ height: "20.5vw" }}>
        <Image
          src="/images/logo-logotype-new.svg"
          alt="frendr"
          width={800}
          height={800}
          className="w-[120vw] max-w-none h-auto -ml-[10vw]"
          style={{ marginTop: "-48.5vw" }}
          priority
        />
      </div>

    </footer>
  )
}
