"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { useRenameThread } from "@/hooks/useThreads"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThreadData } from "@/types"
import {
  archiveThreadAction,
} from "@/app/actions/thread.actions"
import { toast } from "sonner"

interface ThreadItemProps {
  thread: ThreadData
  isActive: boolean
  onDelete: () => void
}

export function ThreadItem({ thread, isActive, onDelete }: ThreadItemProps) {
  const { t } = useTranslation()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(thread.title)
  const renameThread = useRenameThread()

  const handleRename = async () => {
    if (!newTitle.trim()) {
      setIsRenaming(false)
      return
    }

    try {
      await renameThread.mutateAsync({
        threadId: thread.id,
        title: newTitle.trim(),
      })
      setIsRenaming(false)
    } catch {
      toast.error(t("chat.rename-failed"))
    }
  }

  const handleArchive = async () => {
    const result = await archiveThreadAction(thread.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        thread.isArchived ? t("chat.thread-unarchived") : t("chat.thread-archived"),
      )
    }
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-2 py-1">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename()
            if (e.key === "Escape") setIsRenaming(false)
          }}
          onBlur={handleRename}
          className="h-8 text-sm"
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      )}
    >
      <Link
        href={`/chat/${thread.id}`}
        className="flex flex-1 items-center gap-2 truncate min-w-0"
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        {thread.status === "PROCESSING" && (
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-sky-500 animate-pulse"
            title={t("chat.processing")}
            aria-hidden
          />
        )}
        {thread.status === "WAITING" && (
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
            title={t("chat.waiting-sub-agent")}
            aria-hidden
          />
        )}
        <span className="truncate">{thread.title}</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}>
            <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Pencil className="me-2 h-4 w-4" />
            {t("chat.rename")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="me-2 h-4 w-4" />
            {thread.isArchived ? t("chat.unarchive") : t("chat.archive")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t("chat.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
