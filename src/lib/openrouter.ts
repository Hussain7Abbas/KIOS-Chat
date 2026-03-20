import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL!,
    "X-Title": "KIOS Chat",
  },
})

export interface StreamChatParams {
  messages: { role: string; content: string }[]
  model: string
  agentPrompt?: string
}

export async function streamChat(params: StreamChatParams) {
  const systemMessages = params.agentPrompt
    ? [{ role: "system" as const, content: params.agentPrompt }]
    : []

  return client.chat.completions.create({
    model: params.model,
    messages: [
      ...systemMessages,
      ...params.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ],
    stream: true,
  })
}

export async function generateThreadTitle(firstMessage: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate a concise 3-5 word title for the conversation based on the user's first message. Return only the title, nothing else.",
      },
      { role: "user", content: firstMessage },
    ],
    max_tokens: 20,
  })

  return response.choices[0]?.message?.content?.trim() ?? "New Thread"
}

export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  pricing: {
    prompt: string
    completion: string
  }
  context_length: number
  architecture?: {
    modality: string
    tokenizer: string
    instruct_type: string | null
  }
}

export async function getAvailableModels(): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch models from OpenRouter")
  }

  const data = await res.json()
  return data.data as OpenRouterModel[]
}
