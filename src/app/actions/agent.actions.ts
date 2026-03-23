"use server"

import { requireAdmin } from "@/lib/guards"
import {
  agentPromptLengthError,
  getMaxAgentInstructionChars,
} from "@/lib/modelContext"
import { prisma } from "@/lib/prisma"
import { agentPromptSchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"

const defaultPreferredModel =
  process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"

export async function saveAgentPromptAction(
  prompt: string
): Promise<{ error?: string }> {
  const session = await requireAdmin()

  const parsed = agentPromptSchema.safeParse({ prompt })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.prompt?.[0] }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredModel: true },
  })
  const modelId = dbUser?.preferredModel ?? defaultPreferredModel
  const maxChars = await getMaxAgentInstructionChars(modelId)
  const lengthError = agentPromptLengthError(parsed.data.prompt, maxChars)
  if (lengthError) {
    return { error: lengthError }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { agentPrompt: parsed.data.prompt || null },
    })

    revalidatePath("/dashboard")
    return {}
  } catch {
    return { error: "Failed to save agent prompt" }
  }
}
