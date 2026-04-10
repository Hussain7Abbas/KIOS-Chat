import { requireAdmin } from "@/lib/guards"
import { UsageStats } from "@/components/dashboard/UsageStats"
import { BuyCoinsModal } from "@/components/dashboard/BuyCoinsModal"
import { DashboardSectionHeading } from "@/components/dashboard/DashboardSectionHeading"

export default async function DashboardOverviewPage() {
  const session = await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardSectionHeading
          titleKey="dashboard.overview-page-title"
          descriptionKey="dashboard.overview-page-desc"
        />
        <BuyCoinsModal />
      </div>

      {session.user && (
        <UsageStats
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role || "user",
            coinsBalance:
              (session.user as { coinsBalance?: number }).coinsBalance ?? 0,
            coinsPurchased:
              (session.user as { coinsPurchased?: number }).coinsPurchased ?? 0,
          }}
        />
      )}
    </div>
  )
}
