import { requireAdmin } from "@/lib/guards"
import {
  DashboardTopBar,
  DashboardNavSection,
} from "@/components/dashboard/DashboardChrome"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardTopBar />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardNavSection />

        <div className="mt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
