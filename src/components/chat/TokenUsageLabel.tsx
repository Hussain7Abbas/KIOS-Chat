"use client"

import { useTranslation } from "react-i18next"
import { formatUsageLabel } from "@/lib/tokenUsage"
import { cn } from "@/lib/utils"

interface TokenUsageLabelProps {
  totalTokens: number | null | undefined
  contextLength: number | null | undefined
  className?: string
  prefixKey?: string
}

export function TokenUsageLabel({
  totalTokens,
  contextLength,
  className,
  prefixKey = "common.tokens",
}: TokenUsageLabelProps) {
  const { t } = useTranslation()
  const text = formatUsageLabel(totalTokens ?? null, contextLength ?? null)
  return (
    <span
      className={cn(
        "tabular-nums text-muted-foreground",
        className
      )}
      title={t("chat.tokens-usage-title")}
    >
      {t(prefixKey)}: {text}
    </span>
  )
}
