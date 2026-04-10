"use client"

import { useTranslation } from "react-i18next"
import { Toaster } from "@/components/ui/sonner"

export function AppToaster() {
  const { i18n } = useTranslation()
  const rtl = i18n.language === "ar"

  return (
    <Toaster
      richColors
      position={rtl ? "bottom-left" : "bottom-right"}
      dir={rtl ? "rtl" : "ltr"}
    />
  )
}
