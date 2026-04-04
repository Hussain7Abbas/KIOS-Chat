"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { defaultLocale, LOCALE_STORAGE_KEY, isLocale } from "./config"
import ar from "./locales/ar.json"
import en from "./locales/en.json"

export function getStoredLocaleSync(): "ar" | "en" {
  if (typeof window === "undefined") return defaultLocale
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw && isLocale(raw)) return raw
  } catch {
    // ignore
  }
  return defaultLocale
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: defaultLocale,
    fallbackLng: "en",
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export { i18n }
