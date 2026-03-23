import { prisma } from "@/lib/prisma"

/** Short main-thread line only (no sub-agent body). */
export function mainThreadSubmissionNotice(agentName: string): string {
  return `Sub-agent "${agentName}": reply submitted to the main thread.`
}

export async function commitSubThreadAssistantMessage(
  threadId: string,
  subThreadId: string,
  messageId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const msg = await prisma.subThreadMessage.findFirst({
    where: { id: messageId, subThreadId },
    include: {
      subThread: {
        include: { subAgent: { select: { name: true } } },
      },
    },
  })

  if (!msg) {
    return { ok: false, error: "Message not found", status: 404 }
  }
  if (msg.subThread.threadId !== threadId) {
    return { ok: false, error: "Thread mismatch", status: 400 }
  }
  if (msg.role !== "assistant") {
    return {
      ok: false,
      error: "Only assistant messages can be submitted",
      status: 400,
    }
  }
  if (msg.submittedAt != null) {
    return { ok: false, error: "This reply was already submitted", status: 409 }
  }

  if (msg.subThread.status !== "COMPLETED") {
    return { ok: false, error: "Sub-thread is not completed", status: 400 }
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: mainThreadSubmissionNotice(msg.subThread.subAgent.name),
      },
    }),
    prisma.subThreadMessage.update({
      where: { id: messageId },
      data: { submittedAt: new Date() },
    }),
  ])

  return { ok: true }
}

/**
 * Before each main user message: for each completed sub-thread that has never had
 * any reply submitted yet, submit the latest assistant message (short notice on main
 * thread only). Sub-threads with at least one submitted message are left to the user.
 */
export async function commitAllPendingSubThreadsForThread(
  threadId: string
): Promise<void> {
  const subThreads = await prisma.subThread.findMany({
    where: { threadId, status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
    include: {
      subAgent: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  })

  for (const st of subThreads) {
    const anySubmitted = st.messages.some((m) => m.submittedAt != null)
    if (anySubmitted) continue

    const rev = [...st.messages].reverse()
    const target = rev.find(
      (m) => m.role === "assistant" && m.submittedAt == null
    )
    if (!target) continue

    await prisma.$transaction([
      prisma.message.create({
        data: {
          threadId,
          role: "user",
          content: mainThreadSubmissionNotice(st.subAgent.name),
        },
      }),
      prisma.subThreadMessage.update({
        where: { id: target.id },
        data: { submittedAt: new Date() },
      }),
    ])
  }
}
