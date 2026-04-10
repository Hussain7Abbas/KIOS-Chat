"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SubThreadListItem, SubThreadListStatus } from "@/types"
import { PanelRightClose, PanelRight } from "lucide-react"

function statusVariant(
  s: SubThreadListStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "COMPLETED") return "secondary"
  if (s === "FAILED") return "destructive"
  if (s === "PROCESSING" || s === "PENDING") return "outline"
  return "default"
}

interface SubThreadSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SubThreadListItem[]
  onSelectSubThread: (subThreadId: string) => void
}

export function SubThreadSidebar({
  open,
  onOpenChange,
  items,
  onSelectSubThread,
}: SubThreadSidebarProps) {
  const { t } = useTranslation()

  if (!open) {
    return (
      <div className="hidden lg:flex shrink-0 w-10 border-s border-border bg-card/30 flex-col items-center py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onOpenChange(true)}
          aria-label={t("chat.subthreads-open-panel")}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <aside className="hidden lg:flex w-[min(100%,200px)] shrink-0 border-s border-border bg-card/40 flex-col">
      <div className="flex items-center justify-between gap-1 border-b border-border px-2 py-2">
        <span className="text-xs font-medium truncate">{t("chat.subthreads-title")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onOpenChange(false)}
          aria-label={t("chat.subthreads-collapse-panel")}
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground px-1 py-3 text-center leading-snug">
            {t("chat.subthreads-empty")}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSubThread(item.id)}
              className="w-full rounded-md border border-transparent px-2 py-1.5 text-start text-xs hover:bg-accent/50 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono truncate flex-1">{item.subAgentName}</span>
                {item.status !== "COMPLETED" && (
                  <Badge
                    variant={statusVariant(item.status)}
                    className="text-[9px] uppercase px-1 py-0 h-4 shrink-0 tabular-nums"
                  >
                    {item.status.toLowerCase()}
                  </Badge>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
