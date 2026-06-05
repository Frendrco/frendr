import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP are allowed" }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 })
  }

  if (
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    !process.env.CLOUDFLARE_R2_PUBLIC_URL
  ) {
    return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 })
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
  const key = `users/covers/${clerkId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  })

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  const coverUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
  return NextResponse.json({ coverUrl })
}
