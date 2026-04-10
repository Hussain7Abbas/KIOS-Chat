"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, LayoutDashboard } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

interface LandingNavbarProps {
  isAuthenticated: boolean
  isAdmin: boolean
}

export function LandingNavbar({
  isAuthenticated,
  isAdmin,
}: LandingNavbarProps) {
  const { t } = useTranslation()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg min-w-0">
          <MessageSquare className="h-5 w-5 text-primary shrink-0" />
          {t("home.brand")}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeSwitcher />
          <LanguageSwitcher variant="ghost" size="sm" />
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                  <>
                    <LayoutDashboard className="me-2 h-4 w-4" />
                    {t("home.nav-dashboard")}
                  </>
                </Button>
              )}
              <Button size="sm" render={<Link href="/chat" />}>
                {t("home.nav-go-chat")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                {t("home.nav-login")}
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                {t("home.nav-get-started")}
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
