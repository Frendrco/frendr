/**
 * /design — Component & Design System Preview
 *
 * Internal-only route for inspecting all Frendr design tokens and
 * components as they are built. Not linked from any nav.
 */

import { Logo } from "@/components/common/Logo"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Design System",
  robots: { index: false },
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h2 className="font-sans font-medium text-xs uppercase tracking-widest text-foreground/40">
          {title}
        </h2>
        <div className="flex-1 border-t border-border" />
      </div>
      {children}
    </section>
  )
}

export default function DesignPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-6 py-16 flex flex-col gap-16">

      {/* ── Typography ── */}
      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <p className="display-lg">Display LG</p>
          <p className="display-lg-bold">Display LG Bold</p>
          <p className="display-md">Display MD</p>
          <p className="display-sm">Display SM</p>
          <p className="font-sans font-medium text-lg text-foreground/60">
            Body — PP Neue Montreal, Medium. The new home for creative video.
          </p>
          <p className="font-sans text-sm text-foreground/50">
            Small — PP Neue Montreal, Book. Caption and meta text at 14px.
          </p>
          <p className="font-sans font-medium text-xs uppercase tracking-widest text-foreground/40">
            Label — Neue Montreal, Medium, CAPS, tracked
          </p>
        </div>
      </Section>

      {/* ── Colors ── */}
      <Section title="Color Palette">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Spring Green", bg: "bg-spring-green", text: "text-core-black", hex: "#5CE65C" },
            { name: "Core Black", bg: "bg-core-black", text: "text-white", hex: "#000000" },
            { name: "Mist Grey", bg: "bg-mist-grey", text: "text-core-black", hex: "#F1ECE9" },
            { name: "Winter Green", bg: "bg-winter-green", text: "text-core-black", hex: "#B9FFB2" },
            { name: "Bloom Lavender", bg: "bg-bloom-lavender", text: "text-core-black", hex: "#EDC1F6" },
            { name: "Sky Blue", bg: "bg-sky-blue", text: "text-core-black", hex: "#ADD8F6" },
            { name: "Sunny Yellow", bg: "bg-sunny-yellow", text: "text-core-black", hex: "#FFDC7C" },
            { name: "Hyper Blue", bg: "bg-hyper-blue", text: "text-white", hex: "#619EF1" },
            { name: "Dream Lilac", bg: "bg-dream-lilac", text: "text-core-black", hex: "#DCE0FA" },
          ].map((c) => (
            <div
              key={c.name}
              className={cn(
                "flex flex-col justify-end rounded-xl p-4 h-24",
                c.bg, c.text
              )}
            >
              <span className="font-sans font-medium text-xs">{c.name}</span>
              <span className="font-sans text-xs opacity-70">{c.hex}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Logo ── */}
      <Section title="Logo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Light surface */}
          <div className="flex flex-col gap-6 items-start rounded-xl bg-mist-grey p-8">
            <Logo variant="wordmark" height={32} colour="black" />
            <Logo variant="symbol" height={40} colour="black" />
            <Logo variant="combo" height={40} colour="black" />
          </div>
          {/* Dark surface */}
          <div className="flex flex-col gap-6 items-start rounded-xl bg-core-black p-8">
            <Logo variant="wordmark" height={32} colour="white" />
            <Logo variant="symbol" height={40} colour="white" />
            <Logo variant="combo" height={40} colour="white" />
          </div>
        </div>
        {/* Auto (follows theme) */}
        <div className="flex flex-col gap-3 rounded-xl border border-border p-8 items-start">
          <p className="font-sans text-xs text-foreground/40 uppercase tracking-widest mb-2">
            Auto — follows dark/light mode
          </p>
          <Logo variant="wordmark" height={32} colour="auto" />
        </div>
      </Section>

      {/* ── Buttons ── */}
      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Large</Button>
          <Button>Default</Button>
          <Button size="sm">Small</Button>
          <Button size="xs">XS</Button>
        </div>
        {/* Spring Green CTA (the primary brand button) */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex h-10 items-center px-6 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90">
            Sign up — CTA
          </button>
          <button className="inline-flex h-8 items-center px-4 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90">
            Upload — small
          </button>
        </div>
      </Section>

      {/* ── Surfaces ── */}
      <Section title="Surfaces & Border Radius">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="h-24 rounded-sm bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-sm</span>
          </div>
          <div className="h-24 rounded-lg bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-lg</span>
          </div>
          <div className="h-24 rounded-xl bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-xl</span>
          </div>
          <div className="h-24 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-2xl</span>
          </div>
          <div className="h-24 rounded-full bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-full</span>
          </div>
          <div className="h-24 rounded-none bg-muted border border-border flex items-center justify-center">
            <span className="font-sans text-xs text-foreground/40">rounded-none</span>
          </div>
        </div>
      </Section>

    </div>
  )
}
