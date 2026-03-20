import OpenAI from "openai"
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions"

export const openRouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL!,
    "X-Title": "KIOS Chat",
  },
})

export interface StreamChatMessage {
  role: string
  content: string | ChatCompletionContentPart[]
}

/** OpenRouter plugin: PDF / file parsing on their side (see openrouter.ai/docs multimodal PDFs). */
export interface OpenRouterFileParserPlugin {
  id: "file-parser"
  pdf: { engine: "pdf-text" | "native" | "mistral-ocr" }
}

export interface StreamChatParams {
  messages: StreamChatMessage[]
  model: string
  agentPrompt?: string
  openRouterPlugins?: OpenRouterFileParserPlugin[]
}

export function historyIncludesOpenRouterPdfFile(
  messages: StreamChatMessage[]
): boolean {
  for (const m of messages) {
    if (m.role !== "user" || typeof m.content === "string") continue
    for (const p of m.content) {
      if (p.type === "file") return true
    }
  }
  return false
}

export async function streamChat(params: StreamChatParams) {
  const systemMessages = params.agentPrompt
    ? [{ role: "system" as const, content: params.agentPrompt }]
    : []

  const conversationMessages: ChatCompletionMessageParam[] =
    params.messages.map((m): ChatCompletionMessageParam => {
      if (m.role === "assistant") {
        return {
          role: "assistant",
          content: typeof m.content === "string" ? m.content : "",
        }
      }
      if (m.role === "system") {
        return {
          role: "system",
          content: typeof m.content === "string" ? m.content : "",
        }
      }
      return {
        role: "user",
        content: m.content as string | ChatCompletionContentPart[],
      }
    })

  const body = {
    model: params.model,
    messages: [...systemMessages, ...conversationMessages],
    stream: true as const,
    ...(params.openRouterPlugins && params.openRouterPlugins.length > 0
      ? { plugins: params.openRouterPlugins }
      : {}),
  }

  return openRouterClient.chat.completions.create(
    body as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming
  )
}

export interface StreamChatRoundParams {
  messages: ChatCompletionMessageParam[]
  model: string
  agentPrompt?: string
  openRouterPlugins?: OpenRouterFileParserPlugin[]
  tools?: ChatCompletionTool[]
}

type OpenRouterStreamingBody =
  OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
    plugins?: OpenRouterFileParserPlugin[]
    stream_options?: { include_usage?: boolean }
  }

export async function streamChatRound(params: StreamChatRoundParams) {
  const systemMessages = params.agentPrompt
    ? [{ role: "system" as const, content: params.agentPrompt }]
    : []

  const body: OpenRouterStreamingBody = {
    model: params.model,
    messages: [...systemMessages, ...params.messages],
    stream: true,
    stream_options: { include_usage: true },
  }

  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools
    body.tool_choice = "auto"
  }

  if (params.openRouterPlugins && params.openRouterPlugins.length > 0) {
    body.plugins = params.openRouterPlugins
  }

  return openRouterClient.chat.completions.create(body)
}

export interface SubAgentCompletionResult {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  } | null
}

export async function completeSubAgentChat(params: {
  model: string
  system: string
  user: string
}): Promise<SubAgentCompletionResult> {
  const response = await openRouterClient.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  })

  const content = response.choices[0]?.message?.content?.trim() ?? ""
  const u = response.usage
  return {
    content,
    usage:
      u != null
        ? {
            promptTokens: u.prompt_tokens ?? 0,
            completionTokens: u.completion_tokens ?? 0,
            totalTokens: u.total_tokens ?? 0,
          }
        : null,
  }
}

export async function generateThreadTitle(firstMessage: string): Promise<string> {
  const response = await openRouterClient.chat.completions.create({
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
