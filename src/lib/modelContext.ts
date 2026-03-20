import type { OpenRouterModel } from "@/lib/openrouter";

const cache = new Map<string, { contextLength: number; cachedAt: number }>();
const TTL_MS = 60 * 60 * 1000;

async function fetchModelsList(): Promise<OpenRouterModel[]> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return [];
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data: OpenRouterModel[] };
  return data.data ?? [];
}

/**
 * Resolves model context window length from OpenRouter (cached in-memory per process).
 * Uses a plain fetch so it works in the BullMQ worker (no Next.js fetch cache).
 */
export async function getContextLengthForModel(
  modelId: string,
): Promise<number | null> {
  const now = Date.now();
  const hit = cache.get(modelId);
  if (hit && now - hit.cachedAt < TTL_MS) {
    return hit.contextLength;
  }

  try {
    const models = await fetchModelsList();
    const found = models.find((m) => m.id === modelId);
    const contextLength = found?.context_length;
    if (contextLength != null && contextLength > 0) {
      cache.set(modelId, { contextLength, cachedAt: now });
      return contextLength;
    }
  } catch {
    // ignore — UI will omit max
  }
  return null;
}
