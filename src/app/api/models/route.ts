import { NextRequest, NextResponse } from "next/server"
import { groupOpenRouterChatModels } from "@/lib/chatModelsCatalog"
import { getAvailableModels } from "@/lib/openrouter"
import { requireAuthApi } from "@/lib/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAuthApi(request)
  if (error) return error

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OpenRouter is not configured" },
      { status: 503 },
    )
  }

  try {
    const models = await getAvailableModels()
    const grouped = groupOpenRouterChatModels(models)
    return NextResponse.json(grouped)
  } catch {
    return NextResponse.json(
      { error: "Failed to load models from OpenRouter" },
      { status: 502 },
    )
  }
}
