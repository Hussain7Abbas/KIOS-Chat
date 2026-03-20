"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  ChatMessage,
  SubThreadListItem,
  ThreadData,
  ThreadRuntimeStatus,
} from "@/types"

function notifyChatError() {
  toast.error("Something went wrong!")
}

interface ThreadsQueryData {
  threads: ThreadData[]
  threadsRemaining: number
}

interface UseChatOptions {
  threadId: string
  onThreadTitleUpdate?: (title: string) => void
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>
  }
  return {}
}

interface SubthreadSsePayload {
  id: string
  subAgentName: string
  status: "processing" | "completed" | "failed"
  input?: Record<string, unknown>
  output?: string
  error?: string
}

function mergeSubthreadFromEvent(
  prev: SubThreadListItem | undefined,
  ev: SubthreadSsePayload
): SubThreadListItem {
  const statusMap = {
    processing: "PROCESSING",
    completed: "COMPLETED",
    failed: "FAILED",
  } as const

  const base: SubThreadListItem = prev ?? {
    id: ev.id,
    subAgentName: ev.subAgentName,
    status: "PENDING",
    input: ev.input ?? {},
    output: null,
    error: null,
    createdAt: new Date().toISOString(),
  }

  return {
    ...base,
    subAgentName: ev.subAgentName,
    status: statusMap[ev.status],
    input: ev.input !== undefined ? ev.input : base.input,
    output: ev.output !== undefined ? ev.output : base.output,
    error: ev.error !== undefined ? ev.error : base.error,
  }
}

export function useChat({ threadId, onThreadTitleUpdate }: UseChatOptions) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [subThreads, setSubThreads] = useState<SubThreadListItem[]>([])
  const [subAgentActivity, setSubAgentActivity] = useState<{
    name: string
  } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadSubThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/threads/${threadId}/subthreads`)
      if (!res.ok) return
      const data = await res.json()
      const raw = data.subThreads as Array<{
        id: string
        input: unknown
        output: string | null
        status: SubThreadListItem["status"]
        error: string | null
        createdAt: string
        subAgent: { name: string }
      }>
      setSubThreads(
        (raw ?? []).map((s) => ({
          id: s.id,
          subAgentName: s.subAgent.name,
          status: s.status,
          input: asRecord(s.input),
          output: s.output,
          error: s.error,
          createdAt:
            typeof s.createdAt === "string"
              ? s.createdAt
              : new Date(s.createdAt).toISOString(),
        }))
      )
    } catch {
      // ignore
    }
  }, [threadId])

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/threads/${threadId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silently fail
    }
    await loadSubThreads()
  }, [threadId, loadSubThreads])

  useEffect(() => {
    setSubAgentActivity(null)
  }, [threadId])

  const sendMessage = useCallback(
    async (content: string, model: string, fileIds?: string[]) => {
      if (isStreaming) return

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        threadId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setIsStreaming(true)
      setStreamingContent("")
      setSubAgentActivity(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, content, model, fileIds }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error("Failed to send message")
        }

        const reader = res.body?.getReader()
        if (!reader) {
          throw new Error("No response body")
        }

        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6)

            if (data === "[DONE]") break

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>

              if (typeof parsed.text === "string") {
                accumulated += parsed.text
                setStreamingContent(accumulated)
              }

              if (typeof parsed.threadTitle === "string" && onThreadTitleUpdate) {
                onThreadTitleUpdate(parsed.threadTitle)
              }

              if (typeof parsed.threadStatus === "string") {
                queryClient.setQueryData<ThreadsQueryData>(
                  ["threads"],
                  (old) => {
                    if (!old) return old
                    return {
                      ...old,
                      threads: old.threads.map((t) =>
                        t.id === threadId
                          ? {
                              ...t,
                              status: parsed.threadStatus as ThreadRuntimeStatus,
                            }
                          : t
                      ),
                    }
                  }
                )
              }

              if (
                parsed.subthread &&
                typeof parsed.subthread === "object" &&
                parsed.subthread !== null
              ) {
                const st = parsed.subthread as SubthreadSsePayload
                if (
                  st.id &&
                  st.subAgentName &&
                  (st.status === "processing" ||
                    st.status === "completed" ||
                    st.status === "failed")
                ) {
                  setSubThreads((prev) => {
                    const byId = new Map(prev.map((x) => [x.id, x]))
                    const merged = mergeSubthreadFromEvent(byId.get(st.id), st)
                    byId.set(merged.id, merged)
                    return [...byId.values()].sort((a, b) =>
                      a.createdAt.localeCompare(b.createdAt)
                    )
                  })
                  if (st.status === "processing") {
                    setSubAgentActivity({ name: st.subAgentName })
                  } else {
                    setSubAgentActivity(null)
                  }
                }
              }

              if (parsed.error) {
                throw new Error(String(parsed.error))
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }

        if (accumulated) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            threadId,
            role: "assistant",
            content: accumulated,
            model,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        }

        await loadSubThreads()
        queryClient.invalidateQueries({ queryKey: ["threads"] })
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        notifyChatError()
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        )
      } finally {
        setIsStreaming(false)
        setStreamingContent("")
        setSubAgentActivity(null)
        abortControllerRef.current = null
      }
    },
    [
      threadId,
      isStreaming,
      onThreadTitleUpdate,
      queryClient,
      loadSubThreads,
    ]
  )

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    loadMessages,
    subThreads,
    loadSubThreads,
    subAgentActivity,
  }
}
