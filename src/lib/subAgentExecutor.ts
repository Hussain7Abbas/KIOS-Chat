import { prisma } from "@/lib/prisma"
import { completeSubAgentChat } from "@/lib/openrouter"
import { getContextLengthForModel } from "@/lib/modelContext"
import { subAgentSystemSuffix } from "@/lib/subAgentTools"

/**
 * Runs one sub-agent completion for a SubThread row (pending → processing → completed/failed).
 * Used by the BullMQ worker and, when the queue is disabled, inline from the chat API.
 */
export async function runSubAgentSubThread(subThreadId: string): Promise<void> {
  const subThread = await prisma.subThread.findUnique({
    where: { id: subThreadId },
    include: {
      subAgent: { include: { params: true, outputParams: true } },
    },
  })

  if (!subThread) {
    throw new Error(`SubThread not found: ${subThreadId}`)
  }

  const agent = subThread.subAgent

  await prisma.subThread.update({
    where: { id: subThreadId },
    data: { status: "PROCESSING" },
  })

  const system =
    agent.instructions +
    subAgentSystemSuffix(agent.outputFormat, agent.outputParams)

  const userContent = `Input parameters (JSON):\n\n${JSON.stringify(subThread.input, null, 2)}`

  try {
    const result = await completeSubAgentChat({
      model: agent.model,
      system,
      user: userContent,
    })

    const contextLength = await getContextLengthForModel(agent.model)

    await prisma.subThread.update({
      where: { id: subThreadId },
      data: {
        status: "COMPLETED",
        output: result.content,
        error: null,
        promptTokens: result.usage?.promptTokens ?? null,
        completionTokens: result.usage?.completionTokens ?? null,
        totalTokens: result.usage?.totalTokens ?? null,
        contextLength,
        messages: {
          create: {
            role: "assistant",
            content: result.content,
          },
        },
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sub-agent failed"
    await prisma.subThread.update({
      where: { id: subThreadId },
      data: {
        status: "FAILED",
        error: message,
      },
    })
    throw e
  }
}

export function subAgentQueueEnabled(): boolean {
  return process.env.SUBAGENT_USE_QUEUE === "true"
}
