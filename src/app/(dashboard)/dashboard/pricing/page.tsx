import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { getThreadPrice } from "@/lib/settings"
import { ServicePriceEditor } from "@/components/dashboard/ServicePriceEditor"
import { CoinPackageManager } from "@/components/dashboard/CoinPackageManager"
import { DashboardSectionHeading } from "@/components/dashboard/DashboardSectionHeading"
import type { CoinPackageData } from "@/types"

export default async function PricingPage() {
  await requireAdmin()
  const threadPrice = await getThreadPrice()
  const rows = await prisma.coinPackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
  const initialPackages: CoinPackageData[] = rows.map((p) => ({
    id: p.id,
    label: p.label,
    coins: p.coins,
    priceInCents: p.priceInCents,
    isPopular: p.isPopular,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-8">
      <DashboardSectionHeading
        titleKey="dashboard.pricing-page-title"
        descriptionKey="dashboard.pricing-page-desc"
      />
      <ServicePriceEditor initialThreadPrice={threadPrice} />
      <CoinPackageManager initialPackages={initialPackages} />
    </div>
  )
}
