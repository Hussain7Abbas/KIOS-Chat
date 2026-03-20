import { z } from "zod"

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// ─── Chat Schemas ───────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  content: z.string().min(1, "Message cannot be empty"),
  model: z.string().min(1, "Model is required"),
  fileIds: z.array(z.string()).optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

// ─── Thread Schemas ─────────────────────────────────────────────────────────

export const renameThreadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
})

export type RenameThreadInput = z.infer<typeof renameThreadSchema>

// ─── Agent Schemas ──────────────────────────────────────────────────────────

export const agentPromptSchema = z.object({
  prompt: z.string().max(5000, "Prompt cannot exceed 5000 characters"),
})

export type AgentPromptInput = z.infer<typeof agentPromptSchema>

// ─── Subscription Schemas ───────────────────────────────────────────────────

export const purchaseThreadsSchema = z.object({
  packageIndex: z.number().int().min(0).max(2),
})

export type PurchaseThreadsInput = z.infer<typeof purchaseThreadsSchema>
