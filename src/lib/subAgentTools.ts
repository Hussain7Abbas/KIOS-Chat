import type {
  SubAgent,
  SubAgentParam,
  SubAgentOutputParam,
} from "@prisma/client"
import type { ChatCompletionTool } from "openai/resources/chat/completions"

export type SubAgentWithParams = SubAgent & {
  params: SubAgentParam[]
  outputParams: SubAgentOutputParam[]
}

function jsonSchemaType(
  t: string
): "string" | "number" | "boolean" {
  const normalized = t.trim().toLowerCase()
  if (normalized === "number") return "number"
  if (normalized === "boolean") return "boolean"
  // API / DB must send string | number | boolean; default avoids "type missing" in tool schema
  return "string"
}

export function buildSubAgentTools(agents: SubAgentWithParams[]): ChatCompletionTool[] {
  return agents.map((agent) => {
    const properties: Record<string, { type: string; description: string }> = {}
    for (const p of agent.params) {
      properties[p.name] = {
        type: jsonSchemaType(p.type),
        description: p.description,
      }
    }
    const required = agent.params.filter((p) => p.required).map((p) => p.name)
    return {
      type: "function",
      function: {
        name: agent.name,
        description:
          agent.instructions.length > 200
            ? `${agent.instructions.slice(0, 197)}...`
            : agent.instructions,
        parameters: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    }
  })
}

export function subAgentsByName(
  agents: SubAgentWithParams[]
): Map<string, SubAgentWithParams> {
  return new Map(agents.map((a) => [a.name, a]))
}

function outputFieldsHint(outputParams: SubAgentOutputParam[]): string {
  if (outputParams.length === 0) return ""
  const lines = outputParams
    .map((p) => `- **${p.name}** (${p.type}): ${p.description}`)
    .join("\n")
  return `\n\n[Expected output shape]\nYour response should clearly provide or map to these fields:\n${lines}`
}

export function subAgentSystemSuffix(
  outputFormat: string,
  outputParams: SubAgentOutputParam[] = []
): string {
  let formatHint: string
  switch (outputFormat) {
    case "json":
      formatHint =
        "\n\n[Output format]\nRespond with valid JSON only. Do not wrap in markdown code fences."
      break
    case "markdown":
      formatHint =
        "\n\n[Output format]\nFormat your entire response as Markdown."
      break
    default:
      formatHint =
        "\n\n[Output format]\nRespond in plain text unless the user asks otherwise."
  }
  return formatHint + outputFieldsHint(outputParams)
}
