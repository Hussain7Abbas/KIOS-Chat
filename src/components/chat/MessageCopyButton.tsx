"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageCopyButtonProps {
  text: string
  className?: string
}

export function MessageCopyButton({ text, className }: MessageCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    const trimmed = text.trim()
    if (!trimmed) {
      toast.error("Nothing to copy")
      return
    }
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn(
        "absolute top-1.5 inset-e-1.5 z-10 h-7 w-7 opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        void handleClick()
      }}
      aria-label="Copy message"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </Button>
  )
}
