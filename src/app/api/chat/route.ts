import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { sendMessageSchema } from "@/lib/validators"
import {
  streamChat,
  generateThreadTitle,
  historyIncludesOpenRouterPdfFile,
} from "@/lib/openrouter"
import { createOpenRouterPdfParserPlugin } from "@/lib/openRouterPdf"
import { buildUserMessageContent } from "@/lib/chatAttachments"
import type { StreamChatMessage } from "@/lib/openrouter"

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

    // Verify thread ownership
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true, title: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.message.create({
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

    // Load the **last** 20 messages (chronological), not the first 20
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
          const content = await buildUserMessageContent(m.content, m.files)
          return { role: m.role, content }
        }
        return { role: m.role, content: m.content }
      })
    )

    const openRouterPlugins = historyIncludesOpenRouterPdfFile(history)
      ? [createOpenRouterPdfParserPlugin()]
      : undefined

    // Get global agent prompt from the admin
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { agentPrompt: true },
    })

    // Stream from OpenRouter
    const completion = await streamChat({
      messages: history,
      model,
      agentPrompt:
        [admin?.agentPrompt, attachmentSystemHint].filter(Boolean).join("") ||
        undefined,
      openRouterPlugins,
    })

    // Create a streaming response
    let fullResponse = ""
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? ""
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          // Save assistant message after stream completes
          await prisma.message.create({
            data: {
              threadId,
              role: "assistant",
              content: fullResponse,
              model,
            },
          })

          // Update thread timestamp
          await prisma.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          })

          // Auto-generate title if still "New Thread"
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
              // Title generation is non-critical
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err) {
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
