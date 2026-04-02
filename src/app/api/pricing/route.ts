import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getThreadPrice } from "@/lib/settings"

export async function GET() {
  const threadPrice = await getThreadPrice()
  const coinPackages = await prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json({ threadPrice, coinPackages })
}
