"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <p className="font-sans text-sm font-medium text-foreground/30 tracking-widest uppercase">Error</p>
      <h1 className="display-md text-foreground">Something went wrong</h1>
      <p className="font-sans text-sm text-foreground/50 max-w-xs">
        An unexpected error occurred. We&apos;ve been notified.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-full bg-spring-green px-6 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/80"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full border border-border px-6 font-sans font-medium text-sm text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
