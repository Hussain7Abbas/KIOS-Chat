/** Map common extensions when `File.type` is missing or generic. */
const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
}

export function inferMimeTypeFromFilename(filename: string): string | undefined {
  const lower = filename.toLowerCase()
  const dot = lower.lastIndexOf(".")
  if (dot < 0) return undefined
  return EXTENSION_TO_MIME[lower.slice(dot)]
}

/**
 * Prefer `File.type` when reliable; otherwise infer from filename (Safari / some
 * PDFs report empty type or application/octet-stream).
 */
export function resolveUploadedMimeType(file: File): string {
  const fromName = inferMimeTypeFromFilename(file.name)
  if (!file.type || file.type === "application/octet-stream") {
    return fromName ?? file.type
  }
  return file.type
}

export function isPdfAttachment(mimeType: string, filename: string): boolean {
  if (mimeType === "application/pdf") return true
  if (mimeType === "application/octet-stream" && filename.toLowerCase().endsWith(".pdf"))
    return true
  if (!mimeType && filename.toLowerCase().endsWith(".pdf")) return true
  return false
}
