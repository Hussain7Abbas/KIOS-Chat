import { useQuery } from "@tanstack/react-query"
import { fetchInstructionLimit } from "@/lib/instructionLimitClient"

export function useInstructionContextLimit(
  modelId: string,
  textLength: number,
) {
  const {
    data: limitInfo,
    isPending: limitQueryPending,
    isError: limitQueryError,
  } = useQuery({
    queryKey: ["instruction-context-limit", modelId],
    queryFn: () => fetchInstructionLimit(modelId),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })

  const maxChars = limitInfo?.maxChars ?? null
  const contextTokens = limitInfo?.contextTokens ?? null
  const overLimit = maxChars != null && textLength > maxChars

  return {
    limitInfo,
    maxChars,
    contextTokens,
    limitQueryPending,
    limitQueryError,
    overLimit,
  }
}
