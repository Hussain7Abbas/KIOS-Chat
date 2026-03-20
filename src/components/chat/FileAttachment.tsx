"use client"

import { Card } from "@/components/ui/card"
import { isImageType } from "@/lib/utils"
import { FileText, Download } from "lucide-react"
import type { FileAttachment as FileAttachmentType } from "@/types"

interface FileAttachmentProps {
  file: FileAttachmentType
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileAttachment({ file }: FileAttachmentProps) {
  if (isImageType(file.mimeType)) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={file.url}
          alt={file.name}
          className="max-w-[280px] max-h-[200px] rounded-lg object-cover border border-border/50"
          loading="lazy"
        />
      </a>
    )
  }

  return (
    <Card className="flex items-center gap-3 p-3 max-w-[280px]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="h-4 w-4" />
      </a>
    </Card>
  )
}
