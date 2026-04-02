"use server"

import { requireAuth } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getThreadPrice } from "@/lib/settings"

export async function createThreadAction(): Promise<{
  id?: string
  error?: string
}> {
  const session = await requireAuth()

  const threadPrice = await getThreadPrice()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coinsBalance: true },
  })

  if (!user || user.coinsBalance < threadPrice) {
    return { error: "Not enough coins. Purchase more to continue." }
  }

  try {
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

    revalidatePath("/chat")
    return { id: thread.id }
  } catch {
    return { error: "Failed to create thread" }
  }
}

export async function renameThreadAction(
  threadId: string,
  title: string
): Promise<{ error?: string }> {
  const session = await requireAuth()

  if (!title || title.length > 100) {
    return { error: "Title must be between 1 and 100 characters" }
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return { error: "Thread not found" }
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { title },
    })

    revalidatePath("/chat")
    return {}
  } catch {
    return { error: "Failed to rename thread" }
  }
}

export async function deleteThreadAction(
  threadId: string
): Promise<{ error?: string }> {
  const session = await requireAuth()

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return { error: "Thread not found" }
    }

    await prisma.thread.delete({
      where: { id: threadId },
    })

    revalidatePath("/chat")
    return {}
  } catch {
    return { error: "Failed to delete thread" }
  }
}

export async function archiveThreadAction(
  threadId: string
): Promise<{ error?: string }> {
  const session = await requireAuth()

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { userId: true, isArchived: true },
    })

    if (!thread || thread.userId !== session.user.id) {
      return { error: "Thread not found" }
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { isArchived: !thread.isArchived },
    })

    revalidatePath("/chat")
    return {}
  } catch {
    return { error: "Failed to archive thread" }
  }
}

export async function deleteThreadAndRedirect(threadId: string) {
  const result = await deleteThreadAction(threadId)
  if (!result.error) {
    redirect("/chat")
  }
  return result
}
