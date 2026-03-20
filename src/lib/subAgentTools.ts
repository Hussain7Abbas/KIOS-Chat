import type { SubAgent, SubAgentParam } from "@prisma/client"
import type { ChatCompletionTool } from "openai/resources/chat/completions"

export type SubAgentWithParams = SubAgent & { params: SubAgentParam[] }

function jsonSchemaType(
  t: string
): "string" | "number" | "boolean" {
  if (t === "number") return "number"
  if (t === "boolean") return "boolean"
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

export function subAgentSystemSuffix(outputFormat: string): string {
  switch (outputFormat) {
    case "json":
      return "\n\n[Output]\nRespond with valid JSON only. Do not wrap in markdown code fences."
    case "markdown":
      return "\n\n[Output]\nFormat your entire response as Markdown."
    default:
      return "\n\n[Output]\nRespond in plain text unless the user asks otherwise."
  }
}
