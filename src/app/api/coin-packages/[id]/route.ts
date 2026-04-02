import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { updateCoinPackageSchema } from "@/lib/validators"

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const { id } = await ctx.params

  try {
    const body = await request.json()
    const parsed = updateCoinPackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const pkg = await prisma.coinPackage.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json(pkg)
  } catch {
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const { id } = await ctx.params

  try {
    await prisma.coinPackage.delete({
      where: { id },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    )
  }
}
