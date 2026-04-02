import { prisma } from "@/lib/prisma"

/** Default rows identified by `label` so re-seeding updates in place (no duplicates). */
const DEFAULT_COIN_PACKAGES = [
  {
    label: "Starter",
    coins: 5,
    priceInCents: 499,
    sortOrder: 0,
    isPopular: false,
    isActive: true,
  },
  {
    label: "Pro",
    coins: 25,
    priceInCents: 1999,
    sortOrder: 1,
    isPopular: true,
    isActive: true,
  },
  {
    label: "Enterprise",
    coins: 500,
    priceInCents: 3499,
    sortOrder: 2,
    isPopular: false,
    isActive: true,
  },
] as const

/**
 * Idempotent: for each default label, update existing row or create one.
 * Safe to run after manual edits; re-applies seed values for these labels.
 */
export async function seedCoinPackageTable(): Promise<void> {
  for (const def of DEFAULT_COIN_PACKAGES) {
    const existing = await prisma.coinPackage.findFirst({
      where: { label: def.label },
    })

    if (existing) {
      await prisma.coinPackage.update({
        where: { id: existing.id },
        data: {
          coins: def.coins,
          priceInCents: def.priceInCents,
          sortOrder: def.sortOrder,
          isPopular: def.isPopular,
          isActive: def.isActive,
        },
      })
    } else {
      await prisma.coinPackage.create({
        data: { ...def },
      })
    }
  }
  console.log("✅ Coin packages (defaults by label) ensured.")
}
