"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { validateChatUpload } from "@/lib/fileUploadValidation"
import type { UploadResponse } from "@/types"

interface UseFileUploadOptions {
  threadId: string
  maxFiles?: number
  onPdfRejected?: () => void
}

export function useFileUpload({
  threadId,
  maxFiles = 5,
  onPdfRejected,
}: UseFileUploadOptions) {
  const [files, setFiles] = useState<UploadResponse[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      if (files.length >= maxFiles) return null

      const precheck = validateChatUpload(file)
      if (!precheck.valid) {
        if (precheck.kind === "pdf") {
          onPdfRejected?.()
          return null
        }
        toast.error(precheck.error)
        return null
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("threadId", threadId)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data: { error?: string; showOcrModal?: boolean } =
            await res.json()
          if (data.showOcrModal) {
            onPdfRejected?.()
            return null
          }
          toast.error(data.error || "Upload failed")
          return null
        }

        setUploadProgress(100)
        const uploaded: UploadResponse = await res.json()
        setFiles((prev) => [...prev, uploaded])
        return uploaded
      } catch {
        toast.error("Upload failed")
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [threadId, files.length, maxFiles, onPdfRejected]
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return {
    files,
    isUploading,
    uploadProgress,
    uploadFile,
    removeFile,
    clearFiles,
  }
}
