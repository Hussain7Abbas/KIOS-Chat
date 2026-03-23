import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import {
  agentPromptLengthError,
  getMaxAgentInstructionChars,
} from "@/lib/modelContext"
import { prisma } from "@/lib/prisma"
import { agentPromptSchema } from "@/lib/validators"

const defaultPreferredModel =
  process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"

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

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredModel: true },
    })
    const modelId = dbUser?.preferredModel ?? defaultPreferredModel
    const maxChars = await getMaxAgentInstructionChars(modelId)
    const lengthError = agentPromptLengthError(parsed.data.prompt, maxChars)
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 })
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
