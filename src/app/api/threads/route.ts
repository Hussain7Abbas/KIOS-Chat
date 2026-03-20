import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const [threads, user] = await Promise.all([
      prisma.thread.findMany({
        where: {
          userId: session.user.id,
          isArchived: false,
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          isArchived: true,
          userId: true,
          status: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { threadsRemaining: true },
      }),
    ])

    return NextResponse.json({
      threads,
      threadsRemaining: user?.threadsRemaining ?? 0,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { threadsRemaining: true },
    })

    if (!user || user.threadsRemaining <= 0) {
      return NextResponse.json(
        { error: "No threads remaining" },
        { status: 403 }
      )
    }

    const thread = await prisma.$transaction(async (tx) => {
      const newThread = await tx.thread.create({
        data: {
          userId: session.user.id,
          title: "New Thread",
        },
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: { threadsRemaining: { decrement: 1 } },
      })

      return newThread
    })

    return NextResponse.json(thread, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    )
  }
}
