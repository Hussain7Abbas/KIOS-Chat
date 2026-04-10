"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Sun, Moon, Monitor, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ThemeValue = "light" | "dark" | "system"

function useThemeReady() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

/**
 * Three icon buttons (light / dark / system) for navbars. Waits for mount before showing active state.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const mounted = useThemeReady()
  const active = (mounted ? theme : undefined) as ThemeValue | undefined

  const modes: { value: ThemeValue; icon: typeof Sun; labelKey: "light" | "dark" | "system" }[] = [
    { value: "light", icon: Sun, labelKey: "light" },
    { value: "dark", icon: Moon, labelKey: "dark" },
    { value: "system", icon: Monitor, labelKey: "system" },
  ]

  return (
    <div
      role="group"
      aria-label={t("theme.label")}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5",
        className
      )}
    >
      {modes.map(({ value, icon: Icon, labelKey }) => {
        const isActive = active === value
        return (
          <Button
            key={value}
            type="button"
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 shrink-0 rounded-sm"
            onClick={() => setTheme(value)}
            aria-label={t(`theme.${labelKey}`)}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Light / dark / system rows with icons for use inside {@link DropdownMenuContent} (e.g. chat sidebar).
 */
export function ThemeMenuItems() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const mounted = useThemeReady()
  const active = (mounted ? theme : undefined) as ThemeValue | undefined

  const modes: { value: ThemeValue; icon: typeof Sun; labelKey: "light" | "dark" | "system" }[] = [
    { value: "light", icon: Sun, labelKey: "light" },
    { value: "dark", icon: Moon, labelKey: "dark" },
    { value: "system", icon: Monitor, labelKey: "system" },
  ]

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
        {modes.map(({ value, icon: Icon, labelKey }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="me-2 h-4 w-4 shrink-0" />
            <span className="flex-1">{t(`theme.${labelKey}`)}</span>
            {active === value ? (
              <CheckIcon className="ms-auto h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <span className="ms-auto inline-block w-4 shrink-0" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
    </>
  )
}
