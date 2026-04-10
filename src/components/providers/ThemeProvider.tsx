"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * next-themes + Tailwind: `attribute="class"` toggles `dark` on `<html>` to match
 * `@custom-variant dark (&:is(.dark *))` in globals.css.
 * @see https://github.com/pacocoursey/next-themes#class-instead-of-data-attribute
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="kios-chat-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
