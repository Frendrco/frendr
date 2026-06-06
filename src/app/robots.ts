import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/v/", "/search", "/channels"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/sign-in", "/sign-up", "/messages/", "/feed"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
