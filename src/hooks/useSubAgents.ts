"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface SubAgentParamDto {
  id: string
  subAgentId: string
  name: string
  type: string
  description: string
  required: boolean
}

export interface SubAgentOutputParamDto {
  id: string
  subAgentId: string
  name: string
  type: string
  description: string
}

export interface SubAgentDto {
  id: string
  name: string
  instructions: string
  model: string
  outputFormat: string
  createdAt: string
  updatedAt: string
  params: SubAgentParamDto[]
  outputParams: SubAgentOutputParamDto[]
}

export interface CreateSubAgentPayload {
  name: string
  instructions: string
  model: string
  outputFormat: "text" | "json" | "markdown"
  params: Array<{
    name: string
    type: "string" | "number" | "boolean"
    description: string
    required: boolean
  }>
  outputParams: Array<{
    name: string
    type: "string" | "number" | "boolean"
    description: string
  }>
}

async function fetchSubAgents(): Promise<SubAgentDto[]> {
  let res: Response
  try {
    res = await fetch("/api/dashboard/subagents")
  } catch (e) {
    console.error("[subagents list] network error", e)
    throw new Error("Could not reach the server")
  }

  let data: { subAgents?: SubAgentDto[] }
  try {
    data = (await res.json()) as { subAgents?: SubAgentDto[] }
  } catch (e) {
    console.error("[subagents list] response is not valid JSON", e)
    throw new Error("Invalid response from server")
  }

  if (!res.ok) {
    console.error("[subagents list] API error", { status: res.status, body: data })
    throw new Error("Failed to load sub-agents")
  }

  return data.subAgents ?? []
}

type SubAgentApiErrorBody = {
  error?: string
  details?: Record<string, string[] | undefined>
}

async function createSubAgent(payload: CreateSubAgentPayload): Promise<SubAgentDto> {
  let res: Response
  try {
    res = await fetch("/api/dashboard/subagents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error("[subagent create] network error", e)
    throw new Error("Could not reach the server")
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch (e) {
    console.error("[subagent create] response is not valid JSON", e)
    throw new Error("Invalid response from server")
  }

  if (!res.ok) {
    const err = raw as SubAgentApiErrorBody
    console.error("[subagent create] API error", {
      status: res.status,
      body: err,
      payload,
    })
    throw new Error(err.error || "Failed to create sub-agent")
  }

  return raw as SubAgentDto
}

async function updateSubAgent(
  id: string,
  payload: Partial<CreateSubAgentPayload>
): Promise<SubAgentDto> {
  let res: Response
  try {
    res = await fetch(`/api/dashboard/subagents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error("[subagent update] network error", e)
    throw new Error("Could not reach the server")
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch (e) {
    console.error("[subagent update] response is not valid JSON", e)
    throw new Error("Invalid response from server")
  }

  if (!res.ok) {
    const err = raw as SubAgentApiErrorBody
    console.error("[subagent update] API error", {
      status: res.status,
      body: err,
      id,
      payload,
    })
    throw new Error(err.error || "Failed to update sub-agent")
  }

  return raw as SubAgentDto
}

async function deleteSubAgent(id: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(`/api/dashboard/subagents/${id}`, {
      method: "DELETE",
    })
  } catch (e) {
    console.error("[subagent delete] network error", e)
    throw new Error("Could not reach the server")
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as SubAgentApiErrorBody
    console.error("[subagent delete] API error", {
      status: res.status,
      body: err,
      id,
    })
    throw new Error(err.error || "Failed to delete sub-agent")
  }
}

export function useSubAgents() {
  return useQuery({
    queryKey: ["subagents"],
    queryFn: fetchSubAgents,
  })
}

export function useCreateSubAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSubAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subagents"] })
    },
  })
}

export function useUpdateSubAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<CreateSubAgentPayload>
    }) => updateSubAgent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subagents"] })
    },
  })
}

export function useDeleteSubAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSubAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subagents"] })
    },
  })
}
