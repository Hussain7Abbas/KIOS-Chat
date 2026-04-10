"use server"

import { requireAdmin } from "@/lib/guards"
import {
  agentPromptLengthIssue,
  getMaxAgentInstructionChars,
} from "@/lib/modelContext"
import { prisma } from "@/lib/prisma"
import { agentPromptSchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"

const defaultPreferredModel =
  process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"

export type SaveAgentPromptResult =
  | { ok: true }
  | {
      ok: false
      errorKey: string
      maxChars?: number
    }

export async function saveAgentPromptAction(
  prompt: string,
): Promise<SaveAgentPromptResult> {
  const session = await requireAdmin()

  const parsed = agentPromptSchema.safeParse({ prompt })
  if (!parsed.success) {
    return { ok: false, errorKey: "agent.save-failed" }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredModel: true },
  })
  const modelId = dbUser?.preferredModel ?? defaultPreferredModel
  const maxChars = await getMaxAgentInstructionChars(modelId)
  const lengthIssue = agentPromptLengthIssue(parsed.data.prompt, maxChars)
  if (lengthIssue) {
    return {
      ok: false,
      errorKey: "agent.prompt-too-long",
      maxChars: lengthIssue.maxChars,
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { agentPrompt: parsed.data.prompt || null },
    })

    revalidatePath("/dashboard")
    return { ok: true }
  } catch {
    return { ok: false, errorKey: "agent.save-failed" }
  }
}
