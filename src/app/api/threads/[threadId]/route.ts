import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { renameThreadSchema } from "@/lib/validators"

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
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            files: true,
          },
        },
        files: true,
      },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json(thread)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ threadId: string }> }
) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  const { threadId } = await ctx.params

  try {
    const body = await request.json()
    const parsed = renameThreadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: { title: parsed.data.title },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.thread.delete({ where: { id: threadId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    )
  }
}
