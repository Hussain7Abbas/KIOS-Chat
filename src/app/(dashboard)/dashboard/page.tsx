import { requireAdmin } from "@/lib/guards"
import { UsageStats } from "@/components/dashboard/UsageStats"
import { BuyCoinsModal } from "@/components/dashboard/BuyCoinsModal"

export default async function DashboardOverviewPage() {
  const session = await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your Overview</h2>
          <p className="text-sm text-muted-foreground">
            A quick glance at your account usage and recent activity.
          </p>
        </div>
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
