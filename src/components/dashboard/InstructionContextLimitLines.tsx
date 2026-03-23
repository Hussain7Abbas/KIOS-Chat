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
            {charCount.toLocaleString()}/{maxChars.toLocaleString()} characters
          </>
        ) : (
          <>{charCount.toLocaleString()} characters</>
        )}
      </p>
      {limitQueryPending ? (
        <p className={metaClass}>Loading context limit…</p>
      ) : limitQueryError ? (
        <p className="text-xs text-destructive">Could not load context limit.</p>
      ) : contextTokens != null ? (
        <p className={metaClass}>
          Model context: ~{contextTokens.toLocaleString()} tokens (OpenRouter)
        </p>
      ) : limitInfo != null ? (
        <p className={metaClass}>
          OpenRouter did not report context for this model; instructions are not
          length-capped.
        </p>
      ) : null}
    </div>
  )
}
