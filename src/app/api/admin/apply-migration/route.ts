import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Video" ADD COLUMN IF NOT EXISTS "isProcessed" BOOLEAN NOT NULL DEFAULT false`
  )
  return NextResponse.json({ ok: true, message: "isProcessed column added (or already existed)" })
}
