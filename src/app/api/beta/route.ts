import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!process.env.BETA_PASSWORD || password !== process.env.BETA_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("beta_access", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })
  return response
}
