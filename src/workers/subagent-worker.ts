import { Worker } from "bullmq"
import {
  SUBAGENT_QUEUE_NAME,
  getBullMqConnection,
  type SubAgentJobData,
} from "@/lib/queue"
import { runSubAgentSubThread } from "@/lib/subAgentExecutor"

const worker = new Worker<SubAgentJobData>(
  SUBAGENT_QUEUE_NAME,
  async (job) => {
    await runSubAgentSubThread(job.data.subThreadId)
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
