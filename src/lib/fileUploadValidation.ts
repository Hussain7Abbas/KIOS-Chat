import { resolveUploadedMimeType, isPdfAttachment } from "@/lib/mime"

export const OCR_SERVICE_URL = "https://kios-scans.vercel.app"

export function pdfUploadRejectionMessage(): string {
  return `Please convert PDF documents to text before uploading. You can use our OCR service at "${OCR_SERVICE_URL}".`
}

const ALLOWED_DOCUMENT_TYPES = new Set<string>(["text/plain"])

export const MAX_CHAT_UPLOAD_BYTES = 10 * 1024 * 1024

export type ChatUploadValidationResult =
  | { valid: true }
  | { valid: false; kind: "pdf" }
  | {
      valid: false
      kind: "reject"
      errorKey: string
      errorParams?: Record<string, string>
    }

export function validateChatUpload(file: File): ChatUploadValidationResult {
  const effectiveType = resolveUploadedMimeType(file)

  if (isPdfAttachment(effectiveType, file.name)) {
    return { valid: false, kind: "pdf" }
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(effectiveType)) {
    return {
      valid: false,
      kind: "reject",
      errorKey: "upload.file-type",
      errorParams: {
        type: file.type || "(empty)",
      },
    }
  }

  if (file.size > MAX_CHAT_UPLOAD_BYTES) {
    return {
      valid: false,
      kind: "reject",
      errorKey: "upload.file-too-large",
    }
  }

  return { valid: true }
}
