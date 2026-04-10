import { z } from "zod"

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("validation.invalid-email"),
  password: z.string().min(8, "validation.password-min"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "validation.name-min"),
    email: z.string().email("validation.invalid-email"),
    password: z.string().min(8, "validation.password-min"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwords-no-match",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// ─── Chat Schemas ───────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  threadId: z.string().min(1, "validation.thread-id-required"),
  content: z.string().min(1, "validation.message-empty"),
  model: z.string().min(1, "validation.model-required"),
  fileIds: z.array(z.string()).optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const subThreadChatSchema = z.object({
  content: z.string().min(1, "validation.message-empty"),
})

export type SubThreadChatInput = z.infer<typeof subThreadChatSchema>

export const commitSubThreadMessageSchema = z.object({
  messageId: z.string().min(1, "validation.message-id-required"),
})

export type CommitSubThreadMessageInput = z.infer<
  typeof commitSubThreadMessageSchema
>

// ─── Thread Schemas ─────────────────────────────────────────────────────────

export const renameThreadSchema = z.object({
  title: z.string().min(1, "validation.title-required").max(100, "validation.title-too-long"),
})

export type RenameThreadInput = z.infer<typeof renameThreadSchema>

// ─── Agent Schemas ──────────────────────────────────────────────────────────

export const agentPromptSchema = z.object({
  prompt: z.string(),
})

export type AgentPromptInput = z.infer<typeof agentPromptSchema>

// ─── Sub-Agent Schemas ───────────────────────────────────────────────────────

const subAgentToolNameRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/

export const subAgentParamSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(subAgentToolNameRegex, "validation.param-name-tools"),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string().min(1).max(2000),
  required: z.boolean(),
})

/** Describes expected output fields (documentation for the sub-agent prompt). */
export const subAgentOutputParamSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(subAgentToolNameRegex, "validation.output-field-name"),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string().min(1).max(2000),
})

export const createSubAgentSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(subAgentToolNameRegex, "validation.subagent-name-format"),
  instructions: z.string().min(1),
  model: z.string().min(1),
  outputFormat: z.enum(["text", "json", "markdown"]),
  params: z.array(subAgentParamSchema).default([]),
  outputParams: z.array(subAgentOutputParamSchema).default([]),
})

export const updateSubAgentSchema = z.object({
  name: createSubAgentSchema.shape.name.optional(),
  instructions: createSubAgentSchema.shape.instructions.optional(),
  model: z.string().min(1).optional(),
  outputFormat: z.enum(["text", "json", "markdown"]).optional(),
  params: z.array(subAgentParamSchema).optional(),
  outputParams: z.array(subAgentOutputParamSchema).optional(),
})

export type CreateSubAgentInput = z.infer<typeof createSubAgentSchema>
export type UpdateSubAgentInput = z.infer<typeof updateSubAgentSchema>

// ─── Coin Purchase Schemas ───────────────────────────────────────────────────

export const purchaseCoinsSchema = z.object({
  coinPackageId: z.string().min(1),
})

export type PurchaseCoinsInput = z.infer<typeof purchaseCoinsSchema>

// ─── Settings & Coin Packages ────────────────────────────────────────────────

export const patchSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export type PatchSettingInput = z.infer<typeof patchSettingSchema>

export const createCoinPackageSchema = z.object({
  label: z.string().min(1).max(128),
  coins: z.number().int().min(1),
  priceInCents: z.number().int().min(1),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export type CreateCoinPackageInput = z.infer<typeof createCoinPackageSchema>

export const updateCoinPackageSchema = createCoinPackageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "validation.update-one-field",
  })

export type UpdateCoinPackageInput = z.infer<typeof updateCoinPackageSchema>
