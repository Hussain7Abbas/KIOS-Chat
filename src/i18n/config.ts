export const defaultLocale = "ar" as const

export const locales = ["ar", "en"] as const

export type Locale = (typeof locales)[number]

export const LOCALE_STORAGE_KEY = "kios-locale"

export function isLocale(value: string): value is Locale {
  return value === "ar" || value === "en"
}
