import { Worker } from "bullmq"
import {
  SUBAGENT_QUEUE_NAME,
  getBullMqConnection,
  type SubAgentJobData,
} from "@/lib/queue"
import { prisma } from "@/lib/prisma"
import { completeSubAgentChat } from "@/lib/openrouter"
import { subAgentSystemSuffix } from "@/lib/subAgentTools"

const worker = new Worker<SubAgentJobData>(
  SUBAGENT_QUEUE_NAME,
  async (job) => {
    const { subThreadId } = job.data

    const subThread = await prisma.subThread.findUnique({
      where: { id: subThreadId },
      include: {
        subAgent: { include: { params: true } },
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
      agent.instructions + subAgentSystemSuffix(agent.outputFormat)

    const userContent = `Input parameters (JSON):\n\n${JSON.stringify(subThread.input, null, 2)}`

    try {
      const output = await completeSubAgentChat({
        model: agent.model,
        system,
        user: userContent,
      })

      await prisma.subThread.update({
        where: { id: subThreadId },
        data: {
          status: "COMPLETED",
          output,
          error: null,
        },
      })

      return { output }
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
  },
  { connection: getBullMqConnection() }
)

worker.on("failed", (job, err) => {
  console.error("[subagent-worker] job failed", job?.id, err)
})

worker.on("completed", () => {
  // optional: debug log
})

console.log("[subagent-worker] listening on queue", SUBAGENT_QUEUE_NAME)
