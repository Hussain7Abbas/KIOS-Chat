import { prisma } from "@/lib/prisma"
import { THREAD_PRICE_SETTING_KEY } from "@/lib/pricing-constants"

/**
 * Idempotent: same result every run (upsert by primary key `key`).
 */
export async function seedSettingsTable(): Promise<void> {
  await prisma.setting.upsert({
    where: { key: THREAD_PRICE_SETTING_KEY },
    create: { key: THREAD_PRICE_SETTING_KEY, value: "1" },
    update: { value: "1" },
  })
}
