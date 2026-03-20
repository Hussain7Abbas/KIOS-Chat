import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { sendMessageSchema } from "@/lib/validators"
import { streamChat, generateThreadTitle } from "@/lib/openrouter"

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

    // Load conversation history (last 20 messages)
    const history = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, content: true },
    })

    // Get global agent prompt from the admin
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { agentPrompt: true },
    })

    // Stream from OpenRouter
    const completion = await streamChat({
      messages: history.map((m: any) => ({ role: m.role, content: m.content })),
      model,
      agentPrompt: admin?.agentPrompt ?? undefined,
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
