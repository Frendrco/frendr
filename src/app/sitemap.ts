import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"

  const [videos, users] = await Promise.all([
    prisma.video.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    prisma.user.findMany({
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
  ])

  return [
    { url: base,               changeFrequency: "daily",  priority: 1.0, lastModified: new Date() },
    { url: `${base}/search`,   changeFrequency: "daily",  priority: 0.8, lastModified: new Date() },
    { url: `${base}/channels`, changeFrequency: "weekly", priority: 0.7, lastModified: new Date() },
    ...videos.map(v => ({
      url: `${base}/v/${v.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      lastModified: v.updatedAt,
    })),
    ...users.map(u => ({
      url: `${base}/${u.username}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
      lastModified: u.updatedAt,
    })),
  ]
}
