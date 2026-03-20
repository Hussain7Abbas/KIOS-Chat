export interface ChatModelOption {
  id: string
  name: string
}

export interface ChatModelsByProvider {
  openai: ChatModelOption[]
  anthropic: ChatModelOption[]
  google: ChatModelOption[]
}

const PROVIDERS = ["openai", "anthropic", "google"] as const

type Provider = (typeof PROVIDERS)[number]

function providerForId(id: string): Provider | null {
  for (const p of PROVIDERS) {
    if (id.startsWith(`${p}/`)) return p
  }
  return null
}

function sortByName(a: ChatModelOption, b: ChatModelOption): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

export function groupOpenRouterChatModels(
  models: Array<{ id: string; name: string }>,
): ChatModelsByProvider {
  const buckets: Record<Provider, ChatModelOption[]> = {
    openai: [],
    anthropic: [],
    google: [],
  }

  for (const m of models) {
    if (typeof m.id !== "string" || typeof m.name !== "string") continue
    const p = providerForId(m.id)
    if (!p) continue
    buckets[p].push({ id: m.id, name: m.name })
  }

  buckets.openai.sort(sortByName)
  buckets.anthropic.sort(sortByName)
  buckets.google.sort(sortByName)

  return buckets
}

/** Used when the catalog API is unavailable; keeps chat usable. */
export const CHAT_MODELS_FALLBACK: ChatModelsByProvider = {
  openai: [
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  ],
  anthropic: [
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
    { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
  ],
  google: [
    { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
  ],
}

export function findChatModelName(
  catalog: ChatModelsByProvider,
  id: string,
): string | undefined {
  for (const list of [
    catalog.openai,
    catalog.anthropic,
    catalog.google,
  ]) {
    const hit = list.find((m) => m.id === id)
    if (hit) return hit.name
  }
  return undefined
}
