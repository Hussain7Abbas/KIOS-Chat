import { requireAdmin } from "@/lib/guards"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enforce admin-only access
  await requireAdmin()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex h-14 flex-col justify-center px-4 sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>KIOS Admin Dashboard</span>
          </div>
          <Link
            href="/chat"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 sm:mt-0"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Chat
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard overview</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI application, view usage, update agents, and manage subscriptions.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <DashboardNav />

        {/* Page Content */}
        <div className="mt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
