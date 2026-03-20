"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage } from "@/types"

interface UseChatOptions {
  threadId: string
  onThreadTitleUpdate?: (title: string) => void
}

export function useChat({ threadId, onThreadTitleUpdate }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/threads/${threadId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silently fail
    }
  }, [threadId])

  const sendMessage = useCallback(
    async (content: string, model: string, fileIds?: string[]) => {
      if (isStreaming) return

      // Add user message optimistically
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
        if (!reader) return

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
              const parsed = JSON.parse(data)

              if (parsed.text) {
                accumulated += parsed.text
                setStreamingContent(accumulated)
              }

              if (parsed.threadTitle && onThreadTitleUpdate) {
                onThreadTitleUpdate(parsed.threadTitle)
              }

              if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }

        // Add final assistant message
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
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        )
      } finally {
        setIsStreaming(false)
        setStreamingContent("")
        abortControllerRef.current = null
      }
    },
    [threadId, isStreaming, onThreadTitleUpdate]
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
  }
}
