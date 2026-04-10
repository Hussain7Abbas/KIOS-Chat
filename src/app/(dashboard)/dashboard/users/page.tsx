import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { UsersTable } from "@/components/dashboard/UsersTable"
import { DashboardSectionHeading } from "@/components/dashboard/DashboardSectionHeading"
import { UsersStatsCards } from "@/components/dashboard/UsersStatsCards"
import { UsersPageAllHeadingClient } from "@/components/dashboard/UsersPageAllHeadingClient"

export default async function DashboardUsersPage() {
  await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      coinsBalance: true,
      coinsPurchased: true,
      createdAt: true,
    },
  })

  const totalUsers = users.length
  const totalCoinsPurchased = users.reduce(
    (acc, u) => acc + u.coinsPurchased,
    0,
  )
  const totalCoinsBalance = users.reduce((acc, u) => acc + u.coinsBalance, 0)

  return (
    <div className="space-y-8">
      <DashboardSectionHeading
        titleKey="dashboard.users-page-title"
        descriptionKey="dashboard.users-page-desc"
      />

      <UsersStatsCards
        totalUsers={totalUsers}
        totalCoinsPurchased={totalCoinsPurchased}
        totalCoinsBalance={totalCoinsBalance}
      />

      <div>
        <UsersPageAllHeadingClient />
        <UsersTable users={users} />
      </div>
    </div>
  )
}
