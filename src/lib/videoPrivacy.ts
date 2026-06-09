import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto"

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(plain, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  const derived = scryptSync(plain, salt, 64).toString("hex")
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"))
}

export function makeAccessToken(videoId: string, passwordHash: string): string {
  const secret = process.env.CLERK_SECRET_KEY ?? "fallback"
  return createHmac("sha256", secret).update(`${videoId}:${passwordHash}`).digest("hex")
}

export function verifyAccessToken(token: string, videoId: string, passwordHash: string): boolean {
  const expected = makeAccessToken(videoId, passwordHash)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"))
}
