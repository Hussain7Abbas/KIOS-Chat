"use client"

import { useRef, useState, useCallback } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SendHorizontal, Paperclip, X, Loader2 } from "lucide-react"
import { useFileUpload } from "@/hooks/useFileUpload"
import { isPdfAttachment } from "@/lib/mime"
import { OCR_SERVICE_URL } from "@/lib/fileUploadValidation"
import type { UploadResponse } from "@/types"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  threadId: string
  isStreaming: boolean
  onSend: (content: string, fileIds?: string[]) => void
}

export function ChatInput({ threadId, isStreaming, onSend }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [ocrModalOpen, setOcrModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { files, isUploading, uploadFile, removeFile, clearFiles } =
    useFileUpload({
      threadId,
      onPdfRejected: () => setOcrModalOpen(true),
    })

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    if (
      files.some((f: UploadResponse) => isPdfAttachment(f.mimeType, f.name))
    ) {
      setOcrModalOpen(true)
      return
    }

    const fileIds = files.map((f: UploadResponse) => f.id)
    onSend(trimmed, fileIds.length > 0 ? fileIds : undefined)
    setInput("")
    clearFiles()

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input, isStreaming, files, onSend, clearFiles])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = "auto"
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
      <Dialog open={ocrModalOpen} onOpenChange={setOcrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert this PDF with KIOS Scans</DialogTitle>
            <DialogDescription>
              PDFs are not attached directly in chat. Use KIOS Scans to turn
              your PDF into text, then upload the resulting .txt file or paste
              the text into your message.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOcrModalOpen(false)}
            >
              Close
            </Button>
            <a
              href={OCR_SERVICE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants())}
            >
              Open KIOS Scans
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file: UploadResponse) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="gap-1.5 py-1 px-2.5"
            >
              <span className="text-xs truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || isUploading}
          className="shrink-0 h-10 w-10"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="text/plain,.txt,application/pdf,.pdf"
        />

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          rows={1}
          className="min-h-[40px] max-h-[200px] resize-none bg-card border-border/50"
        />

        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          className="shrink-0 h-10 w-10"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
