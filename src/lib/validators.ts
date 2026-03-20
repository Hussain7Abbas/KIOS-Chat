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

// ─── Sub-Agent Schemas ───────────────────────────────────────────────────────

const subAgentToolNameRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/

export const subAgentParamSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(subAgentToolNameRegex, "Invalid parameter name for tools"),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string().min(1).max(2000),
  required: z.boolean(),
})

export const createSubAgentSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(subAgentToolNameRegex, "Name must start with a letter; use letters, digits, underscores only"),
  instructions: z.string().min(1).max(20000),
  model: z.string().min(1),
  outputFormat: z.enum(["text", "json", "markdown"]),
  params: z.array(subAgentParamSchema).default([]),
})

export const updateSubAgentSchema = z.object({
  name: createSubAgentSchema.shape.name.optional(),
  instructions: createSubAgentSchema.shape.instructions.optional(),
  model: z.string().min(1).optional(),
  outputFormat: z.enum(["text", "json", "markdown"]).optional(),
  params: z.array(subAgentParamSchema).optional(),
})

export type CreateSubAgentInput = z.infer<typeof createSubAgentSchema>
export type UpdateSubAgentInput = z.infer<typeof updateSubAgentSchema>

// ─── Subscription Schemas ───────────────────────────────────────────────────

export const purchaseThreadsSchema = z.object({
  packageIndex: z.number().int().min(0).max(2),
})

export type PurchaseThreadsInput = z.infer<typeof purchaseThreadsSchema>
