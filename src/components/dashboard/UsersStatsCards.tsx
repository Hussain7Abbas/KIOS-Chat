"use client"

import { useTranslation } from "react-i18next"

export function UsersStatsCards({
  totalUsers,
  totalCoinsPurchased,
  totalCoinsBalance,
}: {
  totalUsers: number
  totalCoinsPurchased: number
  totalCoinsBalance: number
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {t("dashboard.users-stat-total")}
        </h3>
        <div className="text-2xl font-bold mt-2">{totalUsers}</div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {t("dashboard.users-stat-purchased")}
        </h3>
        <div className="text-2xl font-bold mt-2">{totalCoinsPurchased}</div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {t("dashboard.users-stat-balances")}
        </h3>
        <div className="text-2xl font-bold mt-2">{totalCoinsBalance}</div>
      </div>
    </div>
  )
}
