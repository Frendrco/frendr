import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <p className="font-sans text-sm font-medium text-foreground/30 tracking-widest uppercase">404</p>
      <h1 className="display-md text-core-black">Page not found</h1>
      <p className="font-sans text-sm text-foreground/50 max-w-xs">
        This page doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-full bg-spring-green px-6 font-sans font-medium text-sm text-core-black transition-colors hover:bg-spring-green/80"
      >
        Back to Discover
      </Link>
    </div>
  )
}
