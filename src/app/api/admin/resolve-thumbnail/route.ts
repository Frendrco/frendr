import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; frendr-bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const match = html.match(/<meta[^>]+(?:property="og:image"|name="og:image")[^>]+content="([^"]+)"/)
      ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property="og:image"|name="og:image")/)
    if (match?.[1]) return NextResponse.json({ thumbnailUrl: match[1] })
  } catch {}

  return NextResponse.json({ thumbnailUrl: null })
}
