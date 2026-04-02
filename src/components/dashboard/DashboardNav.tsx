"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DashboardNav() {
  const pathname = usePathname()

  // Extract the trailing part of the path, or default to "overview"
  const currentTab = pathname === "/dashboard" 
    ? "overview" 
    : pathname.split("/").pop() || "overview"

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl bg-muted/50 border border-border/50">
        <TabsTrigger value="overview" render={<Link href="/dashboard" />}>
          Overview
        </TabsTrigger>
        <TabsTrigger value="agent" render={<Link href="/dashboard/agent" />}>
          Agent Settings
        </TabsTrigger>
        <TabsTrigger value="users" render={<Link href="/dashboard/users" />}>
          Users
        </TabsTrigger>
        <TabsTrigger value="pricing" render={<Link href="/dashboard/pricing" />}>
          Pricing
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
