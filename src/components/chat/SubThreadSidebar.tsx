"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SubThreadListItem, SubThreadListStatus } from "@/types"
import { ChevronDown, ChevronRight, PanelRightClose, PanelRight } from "lucide-react"
import { ResponseMarkdown } from "./ResponseMarkdown"
import { TokenUsageLabel } from "@/components/chat/TokenUsageLabel"

function statusVariant(
  s: SubThreadListStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "COMPLETED") return "secondary"
  if (s === "FAILED") return "destructive"
  if (s === "PROCESSING" || s === "PENDING") return "outline"
  return "default"
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

interface SubThreadSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SubThreadListItem[]
}

export function SubThreadSidebar({
  open,
  onOpenChange,
  items,
}: SubThreadSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!open) {
    return (
      <div className="hidden lg:flex shrink-0 w-10 border-l border-border bg-card/30 flex-col items-center py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onOpenChange(true)}
          aria-label="Open sub-threads panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <aside className="hidden lg:flex w-[min(100%,320px)] shrink-0 border-l border-border bg-card/40 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium truncate">Sub-threads</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onOpenChange(false)}
          aria-label="Collapse sub-threads panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-4 text-center">
              No sub-agent runs yet for this thread.
            </p>
          ) : (
            items.map((item) => {
              const isExpanded = expandedId === item.id
              const inputStr = JSON.stringify(item.input, null, 2)
              const previewOut = item.output ?? item.error ?? ""
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-background/60 text-left text-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 p-2 text-left hover:bg-accent/40 rounded-t-lg"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-medium font-mono text-xs truncate">
                          {item.subAgentName}
                        </span>
                        <Badge
                          variant={statusVariant(item.status)}
                          className="text-[10px] uppercase"
                        >
                          {item.status.toLowerCase()}
                        </Badge>
                      </div>
                      <TokenUsageLabel
                        totalTokens={item.totalTokens}
                        contextLength={item.contextLength}
                        className="text-[10px] block"
                        prefix="Tok"
                      />
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {truncate(previewOut || inputStr, 120)}
                        </p>
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-2 pb-2 pt-1 space-y-2 text-xs">
                      <TokenUsageLabel
                        totalTokens={item.totalTokens}
                        contextLength={item.contextLength}
                        className="text-[10px]"
                      />
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">
                          Input
                        </p>
                        <pre className="whitespace-pre-wrap break-all rounded-md bg-muted/50 p-2 font-mono">
                          {inputStr}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">
                          Output
                        </p>
                        {item.error ? (
                          <p className="text-destructive">{item.error}</p>
                        ) : item.output ? (
                          <div
                            className={cn(
                              "rounded-md bg-muted/50 p-2 prose prose-sm dark:prose-invert max-w-none"
                            )}
                          >
                            <ResponseMarkdown>{item.output}</ResponseMarkdown>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
