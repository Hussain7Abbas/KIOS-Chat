"use server"

import { requireAdmin } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function giftCoinsAction(userId: string, additionalCoins: number) {
  await requireAdmin()

  if (additionalCoins <= 0) {
    return { error: "Amount must be greater than 0" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        coinsBalance: {
          increment: additionalCoins,
        },
      },
    })

    revalidatePath("/dashboard/users")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to update user coins" }
  }
}
