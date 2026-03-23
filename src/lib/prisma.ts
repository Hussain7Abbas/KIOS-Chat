import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * After `prisma migrate` / schema changes, bump this so dev servers drop the cached
 * client on `globalThis` (otherwise delegates like `subThreadMessage` can be missing).
 */
const PRISMA_DEV_CACHE_BUSTER = "2025-03-subthread-message-submitted-at"

if (process.env.NODE_ENV !== "production") {
  const g = globalThis as typeof globalThis & {
    __kiosPrismaBust?: string
  }
  if (g.__kiosPrismaBust !== PRISMA_DEV_CACHE_BUSTER) {
    globalForPrisma.prisma = undefined
    g.__kiosPrismaBust = PRISMA_DEV_CACHE_BUSTER
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
