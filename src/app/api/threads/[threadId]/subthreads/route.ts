import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ threadId: string }> }
) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  const { threadId } = await ctx.params

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const subThreads = await prisma.subThread.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      include: {
        subAgent: {
          select: { id: true, name: true, model: true, outputFormat: true },
        },
      },
    })

    return NextResponse.json({ subThreads })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sub-threads" },
      { status: 500 }
    )
  }
}
