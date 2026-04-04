"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "react-i18next"

export function DashboardNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const currentTab = pathname === "/dashboard"
    ? "overview"
    : pathname.split("/").pop() || "overview"

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl bg-muted/50 border border-border/50">
        <TabsTrigger value="overview" render={<Link href="/dashboard" />}>
          {t("dashboard.nav-overview")}
        </TabsTrigger>
        <TabsTrigger value="agent" render={<Link href="/dashboard/agent" />}>
          {t("dashboard.nav-agent")}
        </TabsTrigger>
        <TabsTrigger value="users" render={<Link href="/dashboard/users" />}>
          {t("dashboard.nav-users")}
        </TabsTrigger>
        <TabsTrigger value="pricing" render={<Link href="/dashboard/pricing" />}>
          {t("dashboard.nav-pricing")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
