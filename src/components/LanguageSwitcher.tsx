"use client"

import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import type { Locale } from "@/i18n/config"

interface LanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "icon"
  className?: string
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  className,
}: LanguageSwitcherProps) {
  const { t, i18n: i18nInstance } = useTranslation()

  const setLocale = (lng: Locale) => {
    void i18nInstance.changeLanguage(lng)
  }

  const current = (i18nInstance.language === "en" ? "en" : "ar") as Locale

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            className={className}
            aria-label={t("language.label")}
          >
            {size === "icon" ? (
              <Languages className="h-4 w-4" />
            ) : (
              <>
                <Languages className="me-2 h-4 w-4" />
                {current === "ar" ? t("language.ar") : t("language.en")}
              </>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("ar")}>
          {t("language.ar")}
          {current === "ar" ? " ✓" : ""}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t("language.en")}
          {current === "en" ? " ✓" : ""}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
