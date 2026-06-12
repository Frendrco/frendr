import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/common/Logo"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: form ── */}
      <div className="relative flex w-full flex-col items-center justify-start gap-10 bg-background px-8 py-10 md:items-start md:justify-between md:w-1/2 md:px-16 lg:px-24">

        {/* Symbol — top */}
        <Link href="/">
          <Logo variant="symbol" height={28} colour="black" />
        </Link>

        {/* Clerk form — vertically centered */}
        <div className="w-full max-w-sm mx-auto">
          <h1 className="mb-1 font-sans text-2xl font-bold text-foreground text-center md:text-left">
            Enter your email
          </h1>
          <p className="mb-8 font-sans text-sm text-foreground/50 text-center md:text-left">
            Sign up or{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-2">
              log in
            </Link>
          </p>

          <SignUp
            forceRedirectUrl="/onboarding"
            appearance={{
              elements: {
                rootBox:                  "w-full",
                card:                     "w-full",
                // Hide Clerk's own header — we have ours
                header:                   "!hidden",
                // Hide Google / social
                socialButtonsRoot:        "!hidden",
                dividerRow:               "!hidden",
                // Input
                formFieldInput:
                  "h-12 rounded-xl border border-border bg-background font-sans text-sm text-foreground placeholder:text-foreground/30 focus:ring-2 focus:ring-spring-green shadow-none",
                formFieldLabel:           "font-sans font-medium text-sm text-foreground mb-1",
                formFieldRow:             "mb-4",
                // Primary button — large full-width black pill
                formButtonPrimary:
                  "w-full h-12 rounded-full bg-core-black dark:bg-white text-white dark:text-core-black font-sans font-medium text-sm hover:bg-core-black/80 dark:hover:bg-white/90 transition-colors shadow-none mt-2",
                // Footer
                footer:                   "!hidden",
                footerAction:             "!hidden",
                identityPreviewText:      "font-sans text-sm",
                identityPreviewEditButton:"font-sans text-sm underline",
                formResendCodeLink:       "font-sans text-sm text-foreground underline",
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

      {/* ── Right: billboard ── */}
      <div className="relative hidden overflow-hidden md:flex md:w-1/2">
        <Image src="/images/auth-billboard.png" alt="" fill className="object-cover" priority />
      </div>

    </div>
  )
}
