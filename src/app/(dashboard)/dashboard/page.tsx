import { requireAdmin } from "@/lib/guards"
import { UsageStats } from "@/components/dashboard/UsageStats"
import { BuyThreadsModal } from "@/components/dashboard/BuyThreadsModal"

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
        <BuyThreadsModal />
      </div>

      {session.user && (
        <UsageStats 
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role || "user",
            threadsRemaining: (session.user as any).threadsRemaining || 0,
            threadsPurchased: (session.user as any).threadsPurchased || 0,
          }}
        />
      )}
    </div>
  )
}
