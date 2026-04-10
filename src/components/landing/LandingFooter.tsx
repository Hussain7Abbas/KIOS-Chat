"use client"

import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { useTranslation } from "react-i18next"

export function LandingFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border/50 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          {t("home.footer-tagline")}
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            {t("home.footer-features")}
          </Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">
            {t("home.footer-pricing")}
          </Link>
        </div>
      </div>
    </footer>
  )
}
