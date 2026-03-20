"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"
import {
  Sparkles,
  Code,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import type { ChatMessage } from "@/types"

interface ChatWindowProps {
  threadId: string
  threadTitle?: string
}

const SUGGESTED_PROMPTS = [
  {
    icon: Sparkles,
    label: "Creative writing",
    prompt: "Help me write a creative short story about a time traveler",
  },
  {
    icon: Code,
    label: "Code review",
    prompt: "Review this code and suggest improvements for better performance",
  },
  {
    icon: BookOpen,
    label: "Explain concept",
    prompt: "Explain quantum computing in simple terms with examples",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt: "Help me brainstorm innovative product ideas for remote workers",
  },
]

export function ChatWindow({ threadId, threadTitle }: ChatWindowProps) {
  const defaultModel = process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const handleThreadTitleUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["threads"] })
  }, [queryClient])

  const {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    sendMessage,
    loadMessages,
  } = useChat({
    threadId,
    onThreadTitleUpdate: handleThreadTitleUpdate,
  })

  // Load messages when thread changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleSend = (content: string, fileIds?: string[]) => {
    sendMessage(content, defaultModel, fileIds)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt, defaultModel)
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="font-medium text-sm truncate max-w-[300px]">
          {threadTitle || "New Thread"}
        </h1>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          {isEmpty ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-8 max-w-sm">
                Ask anything or choose a suggestion below to get started
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start gap-3 text-left"
                    onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                  >
                    <suggestion.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{suggestion.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="py-4">
              {messages.map((message: ChatMessage) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Streaming Message */}
              {isStreaming && streamingContent && (
                <MessageBubble
                  message={{
                    id: "streaming",
                    threadId,
                    role: "assistant",
                    content: streamingContent,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}

              {/* Loading skeleton before first token */}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3 py-4 px-4">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1 max-w-[60%]">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        threadId={threadId}
        isStreaming={isStreaming}
        onSend={handleSend}
      />
    </div>
  )
}
