import { NextRequest, NextResponse } from "next/server"
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions"
import { Prisma } from "@prisma/client"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { sendMessageSchema } from "@/lib/validators"
import {
  streamChatRound,
  generateThreadTitle,
  historyIncludesOpenRouterPdfFile,
} from "@/lib/openrouter"
import { createOpenRouterPdfParserPlugin } from "@/lib/openRouterPdf"
import { buildUserMessageContent } from "@/lib/chatAttachments"
import type { StreamChatMessage } from "@/lib/openrouter"
import {
  buildSubAgentTools,
  subAgentsByName,
} from "@/lib/subAgentTools"
import {
  getSubAgentQueue,
  getSubAgentQueueEvents,
} from "@/lib/queue"
import { getContextLengthForModel } from "@/lib/modelContext"
import {
  addUsage,
  emptyUsage,
  usageFromOpenAiApi,
} from "@/lib/tokenUsage"

const MAX_TOOL_ROUNDS = 8
const SUB_AGENT_JOB_TIMEOUT_MS = 180_000

function historyToApiMessages(
  history: StreamChatMessage[]
): ChatCompletionMessageParam[] {
  return history.map((m): ChatCompletionMessageParam => {
    if (m.role === "assistant") {
      return {
        role: "assistant",
        content: typeof m.content === "string" ? m.content : "",
      }
    }
    if (m.role === "system") {
      return {
        role: "system",
        content: typeof m.content === "string" ? m.content : "",
      }
    }
    return {
      role: "user",
      content: m.content as string | ChatCompletionContentPart[],
    }
  })
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { threadId, content, model, fileIds } = parsed.data

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true, title: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content,
        ...(fileIds && fileIds.length > 0
          ? {
              files: {
                connect: fileIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
    })

    const messageCount = await prisma.message.count({ where: { threadId } })
    const skip = Math.max(0, messageCount - 20)
    const historyRows = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      skip,
      take: 20,
      select: {
        role: true,
        content: true,
        files: {
          select: { url: true, mimeType: true, name: true, size: true },
        },
      },
    })

    const hasAnyUploadedDocs = historyRows.some(
      (m) => m.role === "user" && m.files.length > 0
    )
    const attachmentSystemHint = hasAnyUploadedDocs
      ? `\n\n[Document uploads]\nOnly .txt file content is attached as \"--- Attached file:\" excerpts. The product allows users to pick PDFs but steers them to OCR (https://kios-scans.vercel.app) instead of attaching PDFs. Legacy threads may include PDF file parts. Images are not supported.`
      : ""

    const history: StreamChatMessage[] = await Promise.all(
      historyRows.map(async (m) => {
        if (m.role === "user" && m.files.length > 0) {
          const built = await buildUserMessageContent(m.content, m.files)
          return { role: m.role, content: built }
        }
        return { role: m.role, content: m.content }
      })
    )

    const openRouterPlugins = historyIncludesOpenRouterPdfFile(history)
      ? [createOpenRouterPdfParserPlugin()]
      : undefined

    const [admin, subAgents] = await Promise.all([
      prisma.user.findFirst({
        where: { role: "admin" },
        select: { agentPrompt: true },
      }),
      prisma.subAgent.findMany({
        include: { params: true, outputParams: true },
        orderBy: { name: "asc" },
      }),
    ])

    const subAgentHint =
      subAgents.length > 0
        ? "\n\n[Sub-agents]\nYou may invoke specialized sub-agents using the provided tools when their expertise is needed. When a tool returns, incorporate its output into your reply."
        : ""

    const combinedAgentPrompt =
      [admin?.agentPrompt, attachmentSystemHint, subAgentHint]
        .filter(Boolean)
        .join("") || undefined

    const tools =
      subAgents.length > 0 ? buildSubAgentTools(subAgents) : undefined
    const agentsByName = subAgentsByName(subAgents)

    const encoder = new TextEncoder()
    let fullResponse = ""

    const readableStream = new ReadableStream({
      async start(controller) {
        const queue = getSubAgentQueue()
        const queueEvents = getSubAgentQueueEvents()
        await queueEvents.waitUntilReady()

        const contextLength = await getContextLengthForModel(model)
        let usageAcc = emptyUsage()

        try {
          await prisma.thread.update({
            where: { id: threadId },
            data: { status: "PROCESSING" },
          })
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ threadStatus: "PROCESSING" })}\n\n`
            )
          )

          const apiMessages = historyToApiMessages(history)

          let round = 0
          let done = false

          while (!done && round < MAX_TOOL_ROUNDS) {
            round += 1

            const completion = await streamChatRound({
              messages: apiMessages,
              model,
              agentPrompt: combinedAgentPrompt,
              openRouterPlugins,
              tools,
            })

            let assistantContent = ""
            let finishReason: string | null = null
            const toolCallsByIndex = new Map<
              number,
              { id: string; name: string; arguments: string }
            >()

            for await (const chunk of completion) {
              if (chunk.usage) {
                const u = usageFromOpenAiApi(chunk.usage)
                if (u) usageAcc = addUsage(usageAcc, u)
              }
              const choice = chunk.choices[0]
              if (!choice) continue
              if (choice.finish_reason) {
                finishReason = choice.finish_reason
              }
              const delta = choice.delta
              const text = delta?.content ?? ""
              if (text) {
                assistantContent += text
                fullResponse += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                )
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0
                  let cur = toolCallsByIndex.get(idx)
                  if (!cur) {
                    cur = { id: tc.id ?? "", name: "", arguments: "" }
                    toolCallsByIndex.set(idx, cur)
                  }
                  if (tc.id) cur.id = tc.id
                  if (tc.function?.name) cur.name = tc.function.name
                  if (tc.function?.arguments) {
                    cur.arguments += tc.function.arguments
                  }
                }
              }
            }

            if (finishReason !== "tool_calls") {
              done = true
              break
            }

            const sorted = [...toolCallsByIndex.entries()].sort(
              (a, b) => a[0] - b[0]
            )
            const toolCalls: ChatCompletionMessageToolCall[] = []
            for (const [idx, v] of sorted) {
              const id = v.id || `call_${idx}`
              const name = v.name
              if (!name) continue
              toolCalls.push({
                id,
                type: "function",
                function: { name, arguments: v.arguments },
              })
            }

            if (toolCalls.length === 0) {
              done = true
              break
            }

            apiMessages.push({
              role: "assistant",
              content: assistantContent.length > 0 ? assistantContent : null,
              tool_calls: toolCalls,
            })

            for (const tc of toolCalls) {
              if (tc.type !== "function") {
                apiMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify({
                    error: "Unsupported tool call type for sub-agents",
                  }),
                })
                continue
              }
              const fn = tc.function
              const subAgent = agentsByName.get(fn.name)
              let toolContent: string

              if (!subAgent) {
                toolContent = JSON.stringify({
                  error: `Unknown sub-agent: ${fn.name}`,
                })
              } else {
                let inputArgs: Record<string, unknown> = {}
                try {
                  const parsedArgs = JSON.parse(fn.arguments || "{}")
                  if (
                    parsedArgs &&
                    typeof parsedArgs === "object" &&
                    !Array.isArray(parsedArgs)
                  ) {
                    inputArgs = parsedArgs as Record<string, unknown>
                  }
                } catch {
                  inputArgs = {}
                }

                await prisma.thread.update({
                  where: { id: threadId },
                  data: { status: "WAITING" },
                })
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ threadStatus: "WAITING" })}\n\n`
                  )
                )

                const subThread = await prisma.subThread.create({
                  data: {
                    threadId,
                    subAgentId: subAgent.id,
                    input: inputArgs as Prisma.InputJsonValue,
                    status: "PENDING",
                  },
                })

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      subthread: {
                        id: subThread.id,
                        subAgentName: subAgent.name,
                        status: "processing",
                        input: inputArgs,
                      },
                    })}\n\n`
                  )
                )

                const job = await queue.add(
                  "run",
                  { subThreadId: subThread.id },
                  { removeOnComplete: true }
                )

                try {
                  await job.waitUntilFinished(
                    queueEvents,
                    SUB_AGENT_JOB_TIMEOUT_MS
                  )
                } catch {
                  await prisma.subThread.update({
                    where: { id: subThread.id },
                    data: {
                      status: "FAILED",
                      error: "Sub-agent timed out or job failed",
                    },
                  })
                }

                const updated = await prisma.subThread.findUnique({
                  where: { id: subThread.id },
                })

                if (updated?.status === "COMPLETED" && updated.output != null) {
                  toolContent = updated.output
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        subthread: {
                          id: subThread.id,
                          subAgentName: subAgent.name,
                          status: "completed",
                          output: updated.output,
                          input: inputArgs,
                          promptTokens: updated.promptTokens,
                          completionTokens: updated.completionTokens,
                          totalTokens: updated.totalTokens,
                          contextLength: updated.contextLength,
                        },
                      })}\n\n`
                    )
                  )
                } else {
                  const err =
                    updated?.error ??
                    (updated?.status === "FAILED"
                      ? "Sub-agent failed"
                      : "Sub-agent did not complete")
                  toolContent = JSON.stringify({ error: err })
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        subthread: {
                          id: subThread.id,
                          subAgentName: subAgent.name,
                          status: "failed",
                          error: err,
                          input: inputArgs,
                          promptTokens: updated?.promptTokens,
                          completionTokens: updated?.completionTokens,
                          totalTokens: updated?.totalTokens,
                          contextLength: updated?.contextLength,
                        },
                      })}\n\n`
                    )
                  )
                }

                await prisma.thread.update({
                  where: { id: threadId },
                  data: { status: "PROCESSING" },
                })
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      threadStatus: "PROCESSING",
                    })}\n\n`
                  )
                )
              }

              apiMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: toolContent,
              })
            }
          }

          await prisma.message.create({
            data: {
              threadId,
              role: "assistant",
              content: fullResponse,
              model,
            },
          })

          const hasUsage =
            usageAcc.promptTokens > 0 ||
            usageAcc.completionTokens > 0 ||
            usageAcc.totalTokens > 0

          await prisma.thread.update({
            where: { id: threadId },
            data: {
              status: "IDLE",
              updatedAt: new Date(),
              ...(contextLength != null ? { contextLength } : {}),
              ...(hasUsage
                ? {
                    lastPromptTokens: usageAcc.promptTokens,
                    lastCompletionTokens: usageAcc.completionTokens,
                    lastTotalTokens: usageAcc.totalTokens,
                  }
                : {}),
            },
          })
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ threadStatus: "IDLE" })}\n\n`
            )
          )

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                usage: {
                  promptTokens: usageAcc.promptTokens,
                  completionTokens: usageAcc.completionTokens,
                  totalTokens: usageAcc.totalTokens,
                  contextLength,
                },
              })}\n\n`
            )
          )

          if (thread.title === "New Thread" && content) {
            try {
              const title = await generateThreadTitle(content)
              await prisma.thread.update({
                where: { id: threadId },
                data: { title },
              })
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ threadTitle: title })}\n\n`
                )
              )
            } catch {
              // non-critical
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err) {
          await prisma.thread
            .update({
              where: { id: threadId },
              data: { status: "IDLE" },
            })
            .catch(() => undefined)

          const errorMessage =
            err instanceof Error ? err.message : "Stream failed"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    )
  }
}
