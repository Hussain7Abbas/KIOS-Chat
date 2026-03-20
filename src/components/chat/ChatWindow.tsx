"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { SubThreadSidebar } from "@/components/chat/SubThreadSidebar"
import { useQueryClient } from "@tanstack/react-query"
import {
  Sparkles,
  Code,
  BookOpen,
  Lightbulb,
  Layers,
} from "lucide-react"
import type { ChatMessage } from "@/types"
import { useSession } from "@/lib/auth-client"
import { ModelSelector } from "@/components/chat/ModelSelector"
import { TokenUsageLabel } from "@/components/chat/TokenUsageLabel"

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
  const defaultModel =
    process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const handleThreadTitleUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["threads"] })
  }, [queryClient])

  const [subSidebarOpen, setSubSidebarOpen] = useState(true)

  const {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    loadMessages,
    subThreads,
    subAgentActivity,
    threadUsage,
  } = useChat({
    threadId,
    onThreadTitleUpdate: handleThreadTitleUpdate,
  })

  const sessionPreferred =
    (session?.user as { preferredModel?: string } | undefined)
      ?.preferredModel ?? defaultModel
  const chatModel = sessionPreferred

  const showSubPanel = subThreads.length > 0 || isStreaming

  // Load messages when thread changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleSend = (content: string, fileIds?: string[]) => {
    sendMessage(content, chatModel, fileIds)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt, chatModel)
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-2 sm:px-4 sm:py-3 shrink-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <h1 className="font-medium text-sm truncate max-w-[min(100%,280px)]">
            {threadTitle || "New Thread"}
          </h1>
          <TokenUsageLabel
            totalTokens={threadUsage.totalTokens}
            contextLength={threadUsage.contextLength}
            className="text-[10px] sm:text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
          {subAgentActivity && (
            <Badge
              variant="secondary"
              className="text-xs font-normal max-w-[140px] truncate animate-pulse"
              title={`Calling sub-agent ${subAgentActivity.name}`}
            >
              {subAgentActivity.name}…
            </Badge>
          )}
          {showSubPanel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 hidden lg:inline-flex"
              onClick={() => setSubSidebarOpen((o) => !o)}
            >
              <Layers className="h-3.5 w-3.5" />
              Sub-threads
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-row">
        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0">
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

        {showSubPanel && (
          <SubThreadSidebar
            open={subSidebarOpen}
            onOpenChange={setSubSidebarOpen}
            items={subThreads}
          />
        )}
      </div>
    </div>
  )
}
