import { Queue, QueueEvents } from "bullmq"
import type { ConnectionOptions } from "bullmq"

export const SUBAGENT_QUEUE_NAME = "subagent-jobs"

export interface SubAgentJobData {
  subThreadId: string
}

function requireRedisUrl(): string {
  const url = process.env.REDIS_URL
  if (!url || url.length === 0) {
    throw new Error("REDIS_URL is required")
  }
  return url
}

/**
 * BullMQ connection from REDIS_URL (avoids duplicate ioredis instance types vs bullmq's nested ioredis).
 */
export function getBullMqConnection(): ConnectionOptions {
  const redisUrl = requireRedisUrl()
  const u = new URL(redisUrl)
  const port = u.port ? Number.parseInt(u.port, 10) : 6379
  const password =
    u.password !== "" ? decodeURIComponent(u.password) : undefined
  const username =
    u.username !== "" ? decodeURIComponent(u.username) : undefined
  return {
    host: u.hostname,
    port,
    ...(password !== undefined ? { password } : {}),
    ...(username !== undefined ? { username } : {}),
    maxRetriesPerRequest: null,
  }
}

let subAgentQueue: Queue<SubAgentJobData> | null = null

export function getSubAgentQueue(): Queue<SubAgentJobData> {
  if (!subAgentQueue) {
    subAgentQueue = new Queue<SubAgentJobData>(SUBAGENT_QUEUE_NAME, {
      connection: getBullMqConnection(),
    })
  }
  return subAgentQueue
}

let subAgentQueueEvents: QueueEvents | null = null

export function getSubAgentQueueEvents(): QueueEvents {
  if (!subAgentQueueEvents) {
    subAgentQueueEvents = new QueueEvents(SUBAGENT_QUEUE_NAME, {
      connection: getBullMqConnection(),
    })
  }
  return subAgentQueueEvents
}
