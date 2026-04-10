import type { OpenRouterModel } from "@/lib/openrouter"

const cache = new Map<string, { contextLength: number; cachedAt: number }>()
const TTL_MS = 60 * 60 * 1000

/** Tokens reserved for chat history + assistant completion (not counted toward instruction budget). */
const RESERVED_TOKENS_FOR_CHAT = 16_384
/** Minimum instruction token budget when the model context is small. */
const MIN_INSTRUCTION_TOKEN_BUDGET = 1_024
/** Conservative chars-per-token estimate for UI and length caps (actual tokenization varies). */
const CHARS_PER_TOKEN_ESTIMATE = 3.5

/**
 * Max instruction length in characters from OpenRouter context_length (tokens).
 * Leaves headroom so threads still fit in the same context window.
 */
export function maxInstructionCharsFromContextTokens(
  contextTokens: number,
): number {
  const tokenBudget = Math.max(
    MIN_INSTRUCTION_TOKEN_BUDGET,
    contextTokens - RESERVED_TOKENS_FOR_CHAT,
  )
  return Math.floor(tokenBudget * CHARS_PER_TOKEN_ESTIMATE)
}

export async function getAgentInstructionLimitInfo(
  modelId: string,
): Promise<{ contextTokens: number | null; maxChars: number | null }> {
  const ctx = await getContextLengthForModel(modelId)
  if (ctx == null) return { contextTokens: null, maxChars: null }
  return {
    contextTokens: ctx,
    maxChars: maxInstructionCharsFromContextTokens(ctx),
  }
}

export async function getMaxAgentInstructionChars(
  modelId: string,
): Promise<number | null> {
  const info = await getAgentInstructionLimitInfo(modelId)
  return info.maxChars
}

/** When non-null, prompt exceeds the model instruction budget; use maxChars for i18n. */
export function agentPromptLengthIssue(
  prompt: string,
  maxChars: number | null,
): { maxChars: number } | null {
  if (maxChars == null) return null
  if (prompt.length <= maxChars) return null
  return { maxChars }
}

/** English message for API routes (legacy); prefer keys + maxChars in new code. */
export function agentPromptLengthError(
  prompt: string,
  maxChars: number | null,
): string | null {
  const issue = agentPromptLengthIssue(prompt, maxChars)
  if (!issue) return null
  return `Instructions are too long for the selected model's context window (max about ${issue.maxChars.toLocaleString()} characters, estimated from OpenRouter). Shorten the text or pick a larger-context model.`
}

async function fetchModelsList(): Promise<OpenRouterModel[]> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return []
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { data: OpenRouterModel[] }
  return data.data ?? []
}

/**
 * Resolves model context window length from OpenRouter (cached in-memory per process).
 * Uses a plain fetch so it works in the BullMQ worker (no Next.js fetch cache).
 */
export async function getContextLengthForModel(
  modelId: string,
): Promise<number | null> {
  const now = Date.now()
  const hit = cache.get(modelId)
  if (hit && now - hit.cachedAt < TTL_MS) {
    return hit.contextLength
  }

  try {
    const models = await fetchModelsList()
    const found = models.find((m) => m.id === modelId)
    const contextLength = found?.context_length
    if (contextLength != null && contextLength > 0) {
      cache.set(modelId, { contextLength, cachedAt: now })
      return contextLength
    }
  } catch {
    // ignore — UI will omit max
  }
  return null
}
