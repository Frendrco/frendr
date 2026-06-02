import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/common/Logo"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: form ── */}
      <div className="relative flex w-full flex-col items-center justify-start gap-10 bg-white px-8 py-10 md:items-start md:justify-between md:w-1/2 md:px-16 lg:px-24">

        {/* Symbol — top */}
        <Link href="/">
          <Logo variant="symbol" height={28} colour="black" />
        </Link>

        {/* Clerk form — vertically centered */}
        <div className="w-full max-w-sm mx-auto">
          <h1 className="mb-1 font-sans text-2xl font-bold text-core-black text-center md:text-left">
            Welcome back
          </h1>
          <p className="mb-8 font-sans text-sm text-foreground/50 text-center md:text-left">
            Or{" "}
            <Link href="/sign-up" className="text-core-black underline underline-offset-2">
              create an account
            </Link>
          </p>

          <SignIn
            forceRedirectUrl="/search"
            appearance={{
              elements: {
                rootBox:                  "w-full",
                card:                     "w-full",
                header:                   "!hidden",
                socialButtonsRoot:        "!hidden",
                dividerRow:               "!hidden",
                formFieldInput:
                  "h-12 rounded-xl border border-border bg-white font-sans text-sm text-core-black placeholder:text-foreground/30 focus:ring-2 focus:ring-spring-green shadow-none",
                formFieldLabel:           "font-sans font-medium text-sm text-core-black mb-1",
                formFieldRow:             "mb-4",
                formButtonPrimary:
                  "w-full h-12 rounded-full bg-core-black text-white font-sans font-medium text-sm hover:bg-core-black/80 transition-colors shadow-none mt-2",
                footer:                   "!hidden",
                footerAction:             "!hidden",
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

      {/* ── Right: billboard ── */}
      <div className="relative hidden overflow-hidden md:flex md:w-1/2">
        <Image src="/images/auth-billboard.png" alt="" fill className="object-cover" priority />
      </div>

    </div>
  )
}
