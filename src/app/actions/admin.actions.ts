"use server"

import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function giftThreadsAction(userId: string, additionalThreads: number) {
  await requireAdmin()
  
  if (additionalThreads <= 0) {
    return { error: "Amount must be greater than 0" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        threadsRemaining: {
          increment: additionalThreads,
        },
      },
    })
    
    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (err) {
    return { error: "Failed to update user threads" }
  }
}