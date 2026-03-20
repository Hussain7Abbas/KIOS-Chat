// ─── OpenRouter Types ───────────────────────────────────────────────────────

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

// ─── Chat Types ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  threadId: string
  role: "user" | "assistant" | "system"
  content: string
  model?: string | null
  files?: FileAttachment[]
  createdAt: Date | string
}

export type ThreadRuntimeStatus = "IDLE" | "PROCESSING" | "WAITING"

export interface ThreadData {
  id: string
  title: string
  userId: string
  createdAt: Date | string
  updatedAt: Date | string
  isArchived: boolean
  status?: ThreadRuntimeStatus
  lastPromptTokens?: number | null
  lastCompletionTokens?: number | null
  lastTotalTokens?: number | null
  contextLength?: number | null
  messages?: ChatMessage[]
}

export type SubThreadListStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"

export interface SubThreadListItem {
  id: string
  subAgentName: string
  status: SubThreadListStatus
  input: Record<string, unknown>
  output: string | null
  error: string | null
  createdAt: string
  promptTokens?: number | null
  completionTokens?: number | null
  totalTokens?: number | null
  contextLength?: number | null
}

export interface FileAttachment {
  id: string
  name: string
  url: string
  mimeType: string
  size: number
  threadId: string
  messageId?: string | null
  createdAt: Date | string
}

// ─── Dashboard Types ────────────────────────────────────────────────────────

export interface PurchaseData {
  id: string
  stripeId: string
  threadsAmount: number
  amountPaid: number
  createdAt: Date | string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string | null
  role: string
  threadsRemaining: number
  threadsPurchased: number
  agentPrompt?: string | null
  preferredModel: string
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

export interface ThreadListResponse {
  threads: ThreadData[]
}

export interface UploadResponse {
  id: string
  url: string
  name: string
  mimeType: string
  size: number
}
