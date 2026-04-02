import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { setSetting } from "@/lib/settings"
import { patchSettingSchema } from "@/lib/validators"

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const key = request.nextUrl.searchParams.get("key")
  if (key) {
    const row = await prisma.setting.findUnique({
      where: { key },
      select: { key: true, value: true },
    })
    return NextResponse.json({ key, value: row?.value ?? null })
  }

  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  })
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = patchSettingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    await setSetting(parsed.data.key, parsed.data.value)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    )
  }
}
