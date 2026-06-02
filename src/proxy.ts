import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/feed(.*)",
  "/admin(.*)",
  "/messages(.*)",
])

export const proxy = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const isBetaRoute = pathname === "/beta" || pathname.startsWith("/api/beta")

  if (process.env.BETA_PASSWORD && !isBetaRoute) {
    const cookie = req.cookies.get("beta_access")?.value
    if (cookie !== process.env.BETA_PASSWORD) {
      return NextResponse.redirect(new URL("/beta", req.url))
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
