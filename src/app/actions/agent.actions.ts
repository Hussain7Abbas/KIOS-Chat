"use server"

import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { agentPromptSchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"

export async function saveAgentPromptAction(
  prompt: string
): Promise<{ error?: string }> {
  const session = await requireAdmin()

  const parsed = agentPromptSchema.safeParse({ prompt })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.prompt?.[0] }
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
