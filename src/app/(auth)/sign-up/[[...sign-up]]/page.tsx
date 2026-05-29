import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { Logo } from "@/components/common/Logo"

const FLOATING = [
  { bg: "bg-bloom-lavender", style: { top: "10%",   left: "8%",   width: 160, height: 160 } },
  { bg: "bg-sky-blue",       style: { top: "6%",    right: "10%", width: 120, height: 120 } },
  { bg: "bg-sunny-yellow",   style: { bottom: "22%", left: "14%", width: 90,  height: 90  } },
  { bg: "bg-winter-green",   style: { bottom: "10%", right: "7%", width: 190, height: 190 } },
  { bg: "bg-dream-lilac",    style: { top: "46%",   right: "26%", width: 68,  height: 68  } },
]

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: form ── */}
      <div className="relative flex w-full flex-col justify-between bg-white px-10 py-10 md:w-1/2 md:px-16 lg:px-24">

        {/* Symbol — top */}
        <Link href="/">
          <Logo variant="symbol" height={28} colour="black" />
        </Link>

        {/* Clerk form — vertically centered */}
        <div className="w-full max-w-sm mx-auto">
          <h1 className="mb-1 font-sans text-2xl font-bold text-core-black">
            Enter your email
          </h1>
          <p className="mb-8 font-sans text-sm text-foreground/50">
            Sign up or{" "}
            <Link href="/sign-in" className="text-core-black underline underline-offset-2">
              log in
            </Link>
          </p>

          <SignUp
            forceRedirectUrl="/onboarding"
            appearance={{
              elements: {
                rootBox:                  "w-full",
                card:                     "w-full shadow-none p-0 bg-transparent",
                // Hide Clerk's own header — we have ours
                header:                   "hidden",
                // Hide Google / social
                socialButtonsRoot:        "hidden",
                dividerRow:               "hidden",
                // Input
                formFieldInput:
                  "h-12 rounded-xl border border-border bg-white font-sans text-sm text-core-black placeholder:text-foreground/30 focus:ring-2 focus:ring-spring-green shadow-none",
                formFieldLabel:           "font-sans font-medium text-sm text-core-black mb-1",
                formFieldRow:             "mb-4",
                // Primary button — large full-width black pill
                formButtonPrimary:
                  "w-full h-12 rounded-full bg-core-black text-white font-sans font-medium text-sm hover:bg-core-black/80 transition-colors shadow-none mt-2",
                // Footer
                footer:                   "hidden",
                footerAction:             "hidden",
                identityPreviewText:      "font-sans text-sm",
                identityPreviewEditButton:"font-sans text-sm underline",
                formResendCodeLink:       "font-sans text-sm text-core-black underline",
                alertText:                "font-sans text-sm",
                otpCodeFieldInput:        "rounded-xl border border-border font-sans text-sm h-12",
              },
            }}
          />
        </div>

        {/* Wordmark — bottom */}
        <Link href="/">
          <Logo variant="wordmark" height={20} colour="black" />
        </Link>

      </div>

      {/* ── Right: colour placeholder ── */}
      <div className="relative hidden overflow-hidden bg-spring-green md:flex md:w-1/2">
        {FLOATING.map((c, i) => (
          <div key={i} className={`absolute rounded-full ${c.bg}`} style={c.style} />
        ))}
      </div>

    </div>
  )
}
