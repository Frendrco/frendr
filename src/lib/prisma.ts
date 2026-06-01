import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrisma() {
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set("sslmode", "verify-full")
  const pool = new Pool({ connectionString: url.toString(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 20000 })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
