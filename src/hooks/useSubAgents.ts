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

export interface SubAgentDto {
  id: string
  name: string
  instructions: string
  model: string
  outputFormat: string
  createdAt: string
  updatedAt: string
  params: SubAgentParamDto[]
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
}

async function fetchSubAgents(): Promise<SubAgentDto[]> {
  const res = await fetch("/api/dashboard/subagents")
  if (!res.ok) throw new Error("Failed to load sub-agents")
  const data = await res.json()
  return data.subAgents as SubAgentDto[]
}

async function createSubAgent(payload: CreateSubAgentPayload): Promise<SubAgentDto> {
  const res = await fetch("/api/dashboard/subagents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Failed to create sub-agent")
  }
  return res.json()
}

async function updateSubAgent(
  id: string,
  payload: Partial<CreateSubAgentPayload>
): Promise<SubAgentDto> {
  const res = await fetch(`/api/dashboard/subagents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Failed to update sub-agent")
  }
  return res.json()
}

async function deleteSubAgent(id: string): Promise<void> {
  const res = await fetch(`/api/dashboard/subagents/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete sub-agent")
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
