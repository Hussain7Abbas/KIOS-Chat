"use client"

import { cn } from "@/lib/utils"
import { markdownProseClassName } from "@/lib/markdownProse"
import { ResponseMarkdown } from "./ResponseMarkdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileAttachment } from "./FileAttachment"
import { Bot, User } from "lucide-react"
import type { ChatMessage, FileAttachment as FileAttachmentType } from "@/types"
import { MessageCopyButton } from "./MessageCopyButton"

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 py-4 px-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2.5 text-sm",
            !isUser && "group/message pe-10",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {!isUser && message.content.trim().length > 0 && (
            <MessageCopyButton text={message.content} />
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={markdownProseClassName()}>
              <ResponseMarkdown>{message.content}</ResponseMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* File Attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.files.map((file: FileAttachmentType) => (
              <FileAttachment key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
