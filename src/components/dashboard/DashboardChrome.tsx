"use client"

import { useTranslation } from "react-i18next"
import Link from "next/link"
import { MessageSquare, ArrowLeft } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

export function DashboardTopBar() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex h-14 flex-col justify-center px-4 sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 gap-2">
        <div className="flex items-center gap-2 font-semibold min-w-0">
          <MessageSquare className="h-5 w-5 text-primary shrink-0" />
          <span className="truncate">{t("dashboard.layout-title")}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher variant="outline" size="sm" />
          <Link
            href="/chat"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="me-1 h-4 w-4" />
            {t("dashboard.back-to-chat")}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function DashboardOverviewIntro() {
  const { t } = useTranslation()

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.overview-heading")}</h1>
      <p className="text-muted-foreground mt-2">{t("dashboard.overview-description")}</p>
    </div>
  )
}

export function DashboardNavSection() {
  return (
    <>
      <DashboardOverviewIntro />
      <DashboardNav />
    </>
  )
}
