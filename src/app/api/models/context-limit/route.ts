import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { getAgentInstructionLimitInfo } from "@/lib/modelContext"

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const modelId = request.nextUrl.searchParams.get("modelId")?.trim()
  if (!modelId) {
    return NextResponse.json({ error: "modelId is required" }, { status: 400 })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({
      contextTokens: null,
      maxChars: null,
    })
  }

  try {
    const info = await getAgentInstructionLimitInfo(modelId)
    return NextResponse.json(info)
  } catch {
    return NextResponse.json({
      contextTokens: null,
      maxChars: null,
    })
  }
}
