import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, makeAccessToken } from "@/lib/videoPrivacy"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json() as { password?: string }

  if (!body.password?.trim()) {
    return NextResponse.json({ error: "Password required" }, { status: 400 })
  }

  const video = await prisma.video.findUnique({ where: { id }, select: { password: true } })
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!video.password) return NextResponse.json({ error: "Not password protected" }, { status: 400 })

  if (!verifyPassword(body.password.trim(), video.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }

  const token = makeAccessToken(id, video.password)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(`video_access_${id}`, token, {
    httpOnly: true,
    sameSite: "lax",
    path: `/v/${id}`,
    maxAge: 86400,
  })
  return response
}
