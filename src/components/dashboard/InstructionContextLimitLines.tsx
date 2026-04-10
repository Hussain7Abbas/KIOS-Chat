"use client"

import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { InstructionLimitResponse } from "@/lib/instructionLimitClient"

interface InstructionContextLimitLinesProps {
  charCount: number
  maxChars: number | null
  contextTokens: number | null
  limitInfo: InstructionLimitResponse | undefined
  limitQueryPending: boolean
  limitQueryError: boolean
  /** Use text-sm (agent editor) or text-xs (compact, e.g. sub-agent dialog). */
  size?: "default" | "compact"
}

export function InstructionContextLimitLines({
  charCount,
  maxChars,
  contextTokens,
  limitInfo,
  limitQueryPending,
  limitQueryError,
  size = "default",
}: InstructionContextLimitLinesProps) {
  const { t } = useTranslation()
  const overLimit = maxChars != null && charCount > maxChars
  const countClass = size === "compact" ? "text-xs" : "text-sm"
  const metaClass = "text-xs text-muted-foreground"

  return (
    <div className="space-y-0.5">
      <p
        className={cn(
          countClass,
          "text-muted-foreground",
          overLimit && "text-destructive",
        )}
      >
        {maxChars != null ? (
          <>
            {t("instruction-limit.chars", {
              current: charCount.toLocaleString(),
              max: maxChars.toLocaleString(),
            })}
          </>
        ) : (
          <>
            {t("instruction-limit.chars-only", {
              count: charCount.toLocaleString(),
            })}
          </>
        )}
      </p>
      {limitQueryPending ? (
        <p className={metaClass}>{t("instruction-limit.loading")}</p>
      ) : limitQueryError ? (
        <p className="text-xs text-destructive">
          {t("instruction-limit.load-failed")}
        </p>
      ) : contextTokens != null ? (
        <p className={metaClass}>
          {t("instruction-limit.model-context", {
            tokens: contextTokens.toLocaleString(),
          })}
        </p>
      ) : limitInfo != null ? (
        <p className={metaClass}>{t("instruction-limit.no-cap")}</p>
      ) : null}
    </div>
  )
}
