"use client"

import { formatUsageLabel } from "@/lib/tokenUsage"
import { cn } from "@/lib/utils"

interface TokenUsageLabelProps {
  totalTokens: number | null | undefined
  contextLength: number | null | undefined
  className?: string
  prefix?: string
}

export function TokenUsageLabel({
  totalTokens,
  contextLength,
  className,
  prefix = "Tokens",
}: TokenUsageLabelProps) {
  const text = formatUsageLabel(totalTokens ?? null, contextLength ?? null)
  return (
    <span
      className={cn(
        "tabular-nums text-muted-foreground",
        className
      )}
      title="Last request: total tokens / model context window (when reported by the provider)"
    >
      {prefix}: {text}
    </span>
  )
}
