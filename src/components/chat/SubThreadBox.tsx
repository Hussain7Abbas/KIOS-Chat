"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SubThreadMarkdown } from "./SubThreadMarkdown"
import { MessageCopyButton } from "./MessageCopyButton"
import { TokenUsageLabel } from "@/components/chat/TokenUsageLabel"
import { GitCommitHorizontal, Layers, Loader2, SendHorizontal } from "lucide-react"
import type { SubThreadListItem, SubThreadMessageItem } from "@/types"

function statusVariant(
  s: SubThreadListItem["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "COMPLETED") return "secondary"
  if (s === "FAILED") return "destructive"
  if (s === "PROCESSING" || s === "PENDING") return "outline"
  return "default"
}

interface SubThreadDetailResponse {
  subThread: {
    id: string
    status: SubThreadListItem["status"]
    output: string | null
    error: string | null
    messages: Array<{
      id: string
      role: string
      content: string
      createdAt: string
      submittedAt: string | null
    }>
    subAgent: { name: string }
    promptTokens: number | null
    completionTokens: number | null
    totalTokens: number | null
    contextLength: number | null
  }
}

function mapMessages(
  raw: SubThreadDetailResponse["subThread"]["messages"]
): SubThreadMessageItem[] {
  return raw.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    createdAt:
      typeof m.createdAt === "string"
        ? m.createdAt
        : new Date(m.createdAt).toISOString(),
    submittedAt:
      m.submittedAt == null
        ? null
        : typeof m.submittedAt === "string"
          ? m.submittedAt
          : new Date(m.submittedAt).toISOString(),
  }))
}

interface SubThreadBoxProps {
  threadId: string
  item: SubThreadListItem
  /** Increments when the main thread reloads (e.g. after send) so we refetch `submittedAt` etc. */
  mainThreadSyncGeneration: number
  onListUpdated: () => Promise<void>
  onMainThreadUpdated: () => Promise<void>
}

export function SubThreadBox({
  threadId,
  item,
  mainThreadSyncGeneration,
  onListUpdated,
  onMainThreadUpdated,
}: SubThreadBoxProps) {
  const [messages, setMessages] = useState<SubThreadMessageItem[]>([])
  const [usage, setUsage] = useState<{
    totalTokens: number | null
    contextLength: number | null
  }>({
    totalTokens: item.totalTokens ?? null,
    contextLength: item.contextLength ?? null,
  })
  const [loadError, setLoadError] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [submittingMessageId, setSubmittingMessageId] = useState<string | null>(
    null
  )
  const [streamText, setStreamText] = useState("")
  /** After latest assistant is submitted, composer is hidden until user asks to continue. */
  const [followUpUnlocked, setFollowUpUnlocked] = useState(false)

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/threads/${threadId}/subthreads/${item.id}`,
        { cache: "no-store", credentials: "include" }
      )
      if (!res.ok) {
        setLoadError(true)
        return
      }
      const data = (await res.json()) as SubThreadDetailResponse
      const st = data.subThread
      if (!st) {
        setLoadError(true)
        return
      }
      const rawMessages = Array.isArray(st.messages) ? st.messages : []
      setMessages(mapMessages(rawMessages))
      setUsage({
        totalTokens: st.totalTokens ?? null,
        contextLength: st.contextLength ?? null,
      })
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [threadId, item.id])

  const isRunning =
    item.status === "PENDING" || item.status === "PROCESSING"

  useEffect(() => {
    void loadDetail()
  }, [loadDetail, item.status, item.output, mainThreadSyncGeneration])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => void loadDetail(), 2000)
    return () => clearInterval(interval)
  }, [isRunning, loadDetail])

  const tail = messages.length > 0 ? messages[messages.length - 1] : undefined
  const tailAssistantSubmitted =
    tail?.role === "assistant" && tail.submittedAt != null

  useEffect(() => {
    if (tail?.role === "assistant" && tail.submittedAt == null) {
      setFollowUpUnlocked(false)
    }
  }, [tail?.id, tail?.role, tail?.submittedAt])

  useEffect(() => {
    if (!followUpUnlocked && tailAssistantSubmitted) {
      setInput("")
    }
  }, [messages, followUpUnlocked, tailAssistantSubmitted])

  const showFollowUpComposer =
    item.status === "COMPLETED" &&
    (!tailAssistantSubmitted || followUpUnlocked || isSending)

  const showContinueSubAgent =
    item.status === "COMPLETED" &&
    tailAssistantSubmitted &&
    !followUpUnlocked &&
    !isSending

  const canSend =
    item.status === "COMPLETED" && !isSending && input.trim().length > 0

  const submitAssistantMessage = async (messageId: string) => {
    if (submittingMessageId != null) return
    setSubmittingMessageId(messageId)
    try {
      const res = await fetch(
        `/api/threads/${threadId}/subthreads/${item.id}/commit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
          credentials: "include",
          cache: "no-store",
        }
      )
      if (!res.ok) {
        let msg = "Could not submit to main chat"
        try {
          const body = (await res.json()) as { error?: string }
          if (typeof body.error === "string") msg = body.error
        } catch {
          /* ignore */
        }
        toast.error(msg)
        return
      }
      setInput("")
      await loadDetail()
      await onListUpdated()
      await onMainThreadUpdated()
    } catch {
      toast.error("Could not submit to main chat")
    } finally {
      setSubmittingMessageId(null)
    }
  }

  const sendFollowUp = async () => {
    const text = input.trim()
    if (!text || isSending || item.status !== "COMPLETED") return

    setIsSending(true)
    setStreamText("")
    setInput("")

    try {
      const res = await fetch(
        `/api/threads/${threadId}/subthreads/${item.id}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
          cache: "no-store",
          credentials: "include",
        }
      )

      if (!res.ok) {
        let msg = "Could not send message"
        try {
          const errBody = (await res.json()) as { error?: string }
          if (typeof errBody.error === "string") msg = errBody.error
        } catch {
          /* ignore */
        }
        toast.error(msg)
        setIsSending(false)
        await onListUpdated()
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setIsSending(false)
        return
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
              setStreamText(accumulated)
            }
            if (
              parsed.usage &&
              typeof parsed.usage === "object" &&
              parsed.usage !== null
            ) {
              const u = parsed.usage as Record<string, unknown>
              setUsage({
                totalTokens:
                  typeof u.totalTokens === "number" ? u.totalTokens : null,
                contextLength:
                  typeof u.contextLength === "number"
                    ? u.contextLength
                    : null,
              })
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

      await loadDetail()
      await onListUpdated()
    } catch {
      toast.error("Sub-agent reply failed")
      await loadDetail()
      await onListUpdated()
    } finally {
      setIsSending(false)
      setStreamText("")
    }
  }

  const showLegacyOutput =
    messages.length === 0 && item.output && item.status === "COMPLETED"

  return (
    <TooltipProvider delay={300}>
      <div
        id={`subthread-${item.id}`}
        className="mx-4 mb-6 rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden scroll-mt-4"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-muted/30">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium font-mono text-xs truncate flex-1">
            {item.subAgentName}
          </span>
          <Badge
            variant={statusVariant(item.status)}
            className="text-[10px] uppercase shrink-0"
          >
            {item.status.toLowerCase()}
          </Badge>
        </div>

        <div className="px-3 py-2 space-y-3 max-h-[min(70vh,520px)] overflow-y-auto">
          <TokenUsageLabel
            totalTokens={usage.totalTokens}
            contextLength={usage.contextLength}
            className="text-[10px]"
            prefix="Tok"
          />

          {loadError && !isRunning && (
            <p className="text-xs text-destructive">Could not load sub-thread.</p>
          )}

          {item.status === "FAILED" && item.error && (
            <p className="text-sm text-destructive">{item.error}</p>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running sub-agent…
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-1.5 items-start",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" &&
                item.status === "COMPLETED" &&
                !m.submittedAt && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 h-8 w-8 mt-0.5"
                          disabled={submittingMessageId != null}
                          onClick={() => void submitAssistantMessage(m.id)}
                          aria-label="Submit this output"
                        >
                          {submittingMessageId === m.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <GitCommitHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      }
                    />
                    <TooltipContent side="top">submit this output</TooltipContent>
                  </Tooltip>
                )}

              <div
                className={cn(
                  "relative rounded-xl px-3 py-2 text-sm max-w-[min(100%,28rem)] min-w-0",
                  m.role === "assistant" && "group/message pe-9",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm",
                  m.role === "assistant" &&
                    m.submittedAt &&
                    "ring-2 ring-primary/50 bg-primary/5"
                )}
              >
                {m.role === "assistant" && m.content.trim().length > 0 && (
                  <MessageCopyButton text={m.content} />
                )}
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <SubThreadMarkdown>{m.content}</SubThreadMarkdown>
                )}
                {m.role === "assistant" && m.submittedAt && (
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                    Submitted to main chat
                  </p>
                )}
              </div>

              {m.role === "assistant" &&
                item.status === "COMPLETED" &&
                !m.submittedAt && <div className="w-8 shrink-0" aria-hidden />}
            </div>
          ))}

          {showLegacyOutput && (
            <div className="relative group/message rounded-xl px-3 py-2 text-sm bg-muted rounded-tl-sm max-w-[min(100%,28rem)] min-w-0 pe-9">
              {(item.output ?? "").trim().length > 0 && (
                <MessageCopyButton text={item.output ?? ""} />
              )}
              <SubThreadMarkdown>{item.output ?? ""}</SubThreadMarkdown>
              <p className="text-[10px] text-muted-foreground mt-2">
                Legacy run — submit is available on assistant messages after a
                follow-up generates rows.
              </p>
            </div>
          )}

          {isSending && streamText && (
            <div className="flex justify-start gap-1.5 items-start">
              <div className="w-8 shrink-0" aria-hidden />
              <div className="relative group/message rounded-xl px-3 py-2 text-sm bg-muted rounded-tl-sm max-w-[min(100%,28rem)] min-w-0 pe-9">
                {streamText.trim().length > 0 && (
                  <MessageCopyButton text={streamText} />
                )}
                <SubThreadMarkdown>{streamText}</SubThreadMarkdown>
                <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {showContinueSubAgent && (
          <div className="border-t border-border px-3 py-2 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFollowUpUnlocked(true)}
            >
              Continue with this sub-agent…
            </Button>
          </div>
        )}

        {showFollowUpComposer && (
          <div className="border-t border-border p-2 flex gap-2 items-end bg-background/80">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message this sub-agent…"
              className="min-h-[40px] max-h-[120px] text-sm resize-none"
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void sendFollowUp()
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0 h-10 w-10"
              disabled={!canSend}
              onClick={() => void sendFollowUp()}
              aria-label="Send to sub-agent"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
