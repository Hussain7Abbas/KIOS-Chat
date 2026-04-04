"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { ThreadData } from "@/types"

interface ThreadsResponse {
  threads: ThreadData[]
  coinsBalance: number
  threadPrice: number
}

async function fetchThreads(): Promise<ThreadsResponse> {
  const res = await fetch("/api/threads")
  if (!res.ok) throw new Error("Failed to fetch threads")
  const data = await res.json()
  return {
    threads: data.threads,
    coinsBalance: data.coinsBalance ?? 0,
    threadPrice: data.threadPrice ?? 1,
  }
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

function mapThreadError(message: string, t: (key: string) => string): string {
  if (message === "Failed to fetch threads") return t("errors.fetch-threads")
  if (message === "Failed to create thread") return t("errors.create-thread")
  if (message === "Failed to rename thread") return t("errors.rename-thread")
  if (message === "Failed to delete thread") return t("errors.delete-thread")
  return message
}

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  })
}

export function useCreateThread() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
    onError: (err: Error) => {
      toast.error(mapThreadError(err.message, t))
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
