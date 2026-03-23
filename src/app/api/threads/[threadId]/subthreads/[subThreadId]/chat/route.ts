import { NextRequest, NextResponse } from "next/server"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { subThreadChatSchema } from "@/lib/validators"
import { streamSubAgentMessages } from "@/lib/openrouter"
import { subAgentSystemSuffix } from "@/lib/subAgentTools"
import { getContextLengthForModel } from "@/lib/modelContext"
import {
  addUsage,
  emptyUsage,
  usageFromOpenAiApi,
} from "@/lib/tokenUsage"

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ threadId: string; subThreadId: string }> }
) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  const { threadId, subThreadId } = await ctx.params

  let bodyJson: unknown
  try {
    bodyJson = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = subThreadChatSchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { content: userText } = parsed.data

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { userId: true },
  })

  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  }

  const subThread = await prisma.subThread.findFirst({
    where: { id: subThreadId, threadId },
    include: {
      subAgent: { include: { params: true, outputParams: true } },
    },
  })

  if (!subThread) {
    return NextResponse.json({ error: "Sub-thread not found" }, { status: 404 })
  }

  if (subThread.status === "PENDING" || subThread.status === "PROCESSING") {
    return NextResponse.json(
      { error: "Sub-thread is still running" },
      { status: 409 }
    )
  }

  if (subThread.status === "FAILED") {
    return NextResponse.json(
      { error: "Sub-thread failed; start a new run from the main agent" },
      { status: 400 }
    )
  }

  const countRow = await prisma.subThread.findUnique({
    where: { id: subThreadId },
    select: { _count: { select: { messages: true } } },
  })
  const msgCount = countRow?._count.messages ?? 0

  if (
    msgCount === 0 &&
    subThread.output &&
    subThread.status === "COMPLETED"
  ) {
    await prisma.subThread.update({
      where: { id: subThreadId },
      data: {
        messages: {
          create: {
            role: "assistant",
            content: subThread.output,
          },
        },
      },
    })
  }

  const afterUser = await prisma.subThread.update({
    where: { id: subThreadId },
    data: {
      messages: {
        create: { role: "user", content: userText },
      },
    },
    select: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  })

  const userRowId = afterUser.messages[0]?.id
  if (!userRowId) {
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    )
  }

  const agent = subThread.subAgent
  const system =
    agent.instructions +
    subAgentSystemSuffix(agent.outputFormat, agent.outputParams)

  const initialUser = `Input parameters (JSON):\n\n${JSON.stringify(subThread.input, null, 2)}`

  const historyPack = await prisma.subThread.findUnique({
    where: { id: subThreadId },
    select: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  })
  const historyRows = historyPack?.messages ?? []

  const conversationTail: ChatCompletionMessageParam[] = historyRows.map(
    (m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  )

  const apiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: initialUser },
    ...conversationTail,
  ]

  const encoder = new TextEncoder()
  let accumulated = ""
  let usageAcc = emptyUsage()

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await streamSubAgentMessages({
          model: agent.model,
          messages: apiMessages,
        })

        for await (const chunk of completion) {
          if (chunk.usage) {
            const u = usageFromOpenAiApi(chunk.usage)
            if (u) usageAcc = addUsage(usageAcc, u)
          }
          const choice = chunk.choices[0]
          if (!choice) continue
          const text = choice.delta?.content ?? ""
          if (text) {
            accumulated += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            )
          }
        }

        const contextLength = await getContextLengthForModel(agent.model)
        const hasUsage =
          usageAcc.promptTokens > 0 ||
          usageAcc.completionTokens > 0 ||
          usageAcc.totalTokens > 0

        await prisma.subThread.update({
          where: { id: subThreadId },
          data: {
            output: accumulated,
            ...(hasUsage
              ? {
                  promptTokens: usageAcc.promptTokens,
                  completionTokens: usageAcc.completionTokens,
                  totalTokens: usageAcc.totalTokens,
                }
              : {}),
            ...(contextLength != null ? { contextLength } : {}),
            messages: {
              create: {
                role: "assistant",
                content: accumulated,
              },
            },
          },
        })

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

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      } catch (err) {
        await prisma.subThread
          .update({
            where: { id: subThreadId },
            data: {
              messages: {
                deleteMany: { id: userRowId },
              },
            },
          })
          .catch(() => undefined)
        const message = err instanceof Error ? err.message : "Stream failed"
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
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
}
