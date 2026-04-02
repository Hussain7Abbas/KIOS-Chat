import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { createCoinPackageSchema } from "@/lib/validators"

export async function GET() {
  const packages = await prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json({ packages })
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = createCoinPackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const pkg = await prisma.coinPackage.create({
      data: {
        label: parsed.data.label,
        coins: parsed.data.coins,
        priceInCents: parsed.data.priceInCents,
        isPopular: parsed.data.isPopular ?? false,
        isActive: parsed.data.isActive ?? true,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    })
    return NextResponse.json(pkg, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    )
  }
}
