import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { UsersTable } from "@/components/dashboard/UsersTable"

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
    0
  )
  const totalCoinsBalance = users.reduce((acc, u) => acc + u.coinsBalance, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Users Management</h2>
        <p className="text-sm text-muted-foreground">
          View all registered users and manage their coin balances.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            Total Users
          </h3>
          <div className="text-2xl font-bold mt-2">{totalUsers}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            Total Coins Purchased
          </h3>
          <div className="text-2xl font-bold mt-2">{totalCoinsPurchased}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            System Coin Balances
          </h3>
          <div className="text-2xl font-bold mt-2">{totalCoinsBalance}</div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-4">All Users</h3>
        <UsersTable users={users} />
      </div>
    </div>
  )
}
