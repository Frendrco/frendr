import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token     = process.env.CLOUDFLARE_STREAM_API_TOKEN

  if (!accountId || !token) {
    return NextResponse.json({ error: "Cloudflare env vars not set" }, { status: 503 })
  }

  const [settingsRes, storageRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/storage-usage`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  const [storage, stream] = await Promise.all([
    settingsRes.json(),
    storageRes.json(),
  ])

  return NextResponse.json({ storage, stream })
}
