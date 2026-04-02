import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { getThreadPrice } from "@/lib/settings"

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const threadPrice = await getThreadPrice()
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
        select: { coinsBalance: true },
      }),
    ])

    return NextResponse.json({
      threads,
      coinsBalance: user?.coinsBalance ?? 0,
      threadPrice,
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
    const threadPrice = await getThreadPrice()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coinsBalance: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.coinsBalance < threadPrice) {
      return NextResponse.json(
        { error: "Not enough coins" },
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
        data: { coinsBalance: { decrement: threadPrice } },
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
