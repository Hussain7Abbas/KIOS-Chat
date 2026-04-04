"use client"

import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import {
  i18n,
  getStoredLocaleSync,
} from "@/i18n/client"
import { LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config"

function applyDocumentLocale(lng: Locale) {
  if (typeof document === "undefined") return
  document.documentElement.lang = lng
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lng = getStoredLocaleSync()
    void i18n.changeLanguage(lng)
    applyDocumentLocale(lng)

    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCALE_STORAGE_KEY || !e.newValue) return
      if (e.newValue === "ar" || e.newValue === "en") {
        void i18n.changeLanguage(e.newValue)
        applyDocumentLocale(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    const handler = (lng: string) => {
      if (lng === "ar" || lng === "en") {
        applyDocumentLocale(lng)
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, lng)
        } catch {
          // ignore
        }
      }
    }
    i18n.on("languageChanged", handler)
    return () => {
      i18n.off("languageChanged", handler)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
