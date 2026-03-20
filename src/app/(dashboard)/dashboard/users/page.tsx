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
      threadsRemaining: true,
      threadsPurchased: true,
      createdAt: true,
    },
  })

  // Calculate some stats globally instead of for single user
  const totalUsers = users.length
  const totalThreadsPurchased = users.reduce((acc: number, user: any) => acc + user.threadsPurchased, 0)
  const totalThreadsRemaining = users.reduce((acc: number, user: any) => acc + user.threadsRemaining, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Users Management</h2>
        <p className="text-sm text-muted-foreground">
          View all registered users and manage their thread balances natively.
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
            Total Threads Purchased
          </h3>
          <div className="text-2xl font-bold mt-2">{totalThreadsPurchased}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
            System Threads Remaining
          </h3>
          <div className="text-2xl font-bold mt-2">{totalThreadsRemaining}</div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-4">All Users</h3>
        <UsersTable users={users} />
      </div>
    </div>
  )
}
