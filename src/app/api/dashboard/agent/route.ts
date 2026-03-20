import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { agentPromptSchema } from "@/lib/validators"

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdminApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = agentPromptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { agentPrompt: parsed.data.prompt || null },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to save agent prompt" },
      { status: 500 }
    )
  }
}
