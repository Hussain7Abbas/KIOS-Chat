export interface InstructionLimitResponse {
  contextTokens: number | null
  maxChars: number | null
}

export async function fetchInstructionLimit(
  modelId: string,
): Promise<InstructionLimitResponse> {
  const res = await fetch(
    `/api/models/context-limit?modelId=${encodeURIComponent(modelId)}`,
    { credentials: "include" },
  )
  if (!res.ok) {
    throw new Error("Failed to load context limit")
  }
  return res.json() as Promise<InstructionLimitResponse>
}
