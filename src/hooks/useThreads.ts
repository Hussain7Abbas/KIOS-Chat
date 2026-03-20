"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ThreadData } from "@/types"

interface ThreadsResponse {
  threads: ThreadData[]
  threadsRemaining: number
}

async function fetchThreads(): Promise<ThreadsResponse> {
  const res = await fetch("/api/threads")
  if (!res.ok) throw new Error("Failed to fetch threads")
  const data = await res.json()
  return { threads: data.threads, threadsRemaining: data.threadsRemaining ?? 0 }
}

async function createThread(): Promise<ThreadData> {
  const res = await fetch("/api/threads", { method: "POST" })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Failed to create thread")
  }
  return res.json()
}

async function renameThread({
  threadId,
  title,
}: {
  threadId: string
  title: string
}): Promise<ThreadData> {
  const res = await fetch(`/api/threads/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error("Failed to rename thread")
  return res.json()
}

async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`/api/threads/${threadId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete thread")
}

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  })
}

export function useCreateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })
}

export function useRenameThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renameThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })
}

export function useDeleteThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })
}
