export interface TokenUsageSnapshot {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export function addUsage(
  acc: TokenUsageSnapshot,
  next: TokenUsageSnapshot | null | undefined
): TokenUsageSnapshot {
  if (!next) return acc
  return {
    promptTokens: acc.promptTokens + next.promptTokens,
    completionTokens: acc.completionTokens + next.completionTokens,
    totalTokens: acc.totalTokens + next.totalTokens,
  }
}

export function emptyUsage(): TokenUsageSnapshot {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
}

export function usageFromOpenAiApi(u: {
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
} | undefined): TokenUsageSnapshot | null {
  if (!u) return null
  const promptTokens = u.prompt_tokens ?? 0
  const completionTokens = u.completion_tokens ?? 0
  const totalTokens = u.total_tokens ?? 0
  if (promptTokens === 0 && completionTokens === 0 && totalTokens === 0) {
    return null
  }
  return { promptTokens, completionTokens, totalTokens }
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`
  return String(n)
}

/** Renders "12.5k / 128k", "— / 128k" (usage unknown), or "—". */
export function formatUsageLabel(
  total: number | null | undefined,
  max: number | null | undefined
): string {
  const maxPart = max != null && max > 0 ? formatTokenCount(max) : null
  if (total == null || total < 0) {
    return maxPart ? `— / ${maxPart}` : "—"
  }
  if (maxPart) {
    return `${formatTokenCount(total)} / ${maxPart}`
  }
  return formatTokenCount(total)
}
