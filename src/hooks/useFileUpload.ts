"use client"

import { useState, useCallback } from "react"
import type { UploadResponse } from "@/types"

interface UseFileUploadOptions {
  threadId: string
  maxFiles?: number
}

export function useFileUpload({
  threadId,
  maxFiles = 5,
}: UseFileUploadOptions) {
  const [files, setFiles] = useState<UploadResponse[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      if (files.length >= maxFiles) return null

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
          const data = await res.json()
          throw new Error(data.error || "Upload failed")
        }

        setUploadProgress(100)
        const uploaded: UploadResponse = await res.json()
        setFiles((prev) => [...prev, uploaded])
        return uploaded
      } catch {
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [threadId, files.length, maxFiles]
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
