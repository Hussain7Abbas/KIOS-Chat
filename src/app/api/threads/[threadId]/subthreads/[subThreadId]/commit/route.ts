import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { commitSubThreadAssistantMessage } from "@/lib/subThreadCommit"
import { commitSubThreadMessageSchema } from "@/lib/validators"

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

  const parsed = commitSubThreadMessageSchema.safeParse(bodyJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { messageId } = parsed.data

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { userId: true },
  })

  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 })
  }

  const result = await commitSubThreadAssistantMessage(
    threadId,
    subThreadId,
    messageId
  )
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({ submitted: true })
}
