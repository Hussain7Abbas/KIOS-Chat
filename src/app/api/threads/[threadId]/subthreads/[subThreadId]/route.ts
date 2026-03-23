import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ threadId: string; subThreadId: string }> }
) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  const { threadId, subThreadId } = await ctx.params

  try {
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
        subAgent: {
          select: { name: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!subThread) {
      return NextResponse.json({ error: "Sub-thread not found" }, { status: 404 })
    }

    return NextResponse.json({ subThread })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch sub-thread"
    console.error("[subthread GET]", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
