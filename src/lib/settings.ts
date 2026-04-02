import { prisma } from "@/lib/prisma"
import { THREAD_PRICE_SETTING_KEY } from "@/lib/pricing-constants"

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

const DEFAULT_THREAD_PRICE = 1

export async function getThreadPrice(): Promise<number> {
  const raw = await getSetting(THREAD_PRICE_SETTING_KEY)
  if (raw === null) {
    return DEFAULT_THREAD_PRICE
  }
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n) || n < 0) {
    return DEFAULT_THREAD_PRICE
  }
  return n
}
