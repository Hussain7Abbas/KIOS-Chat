import { resolveUploadedMimeType, isPdfAttachment } from "@/lib/mime";

export const OCR_SERVICE_URL = "https://kios-scans.vercel.app";

export function pdfUploadRejectionMessage(): string {
  return `Please convert PDF documents to text before uploading. You can use our OCR service at "${OCR_SERVICE_URL}".`;
}

const ALLOWED_DOCUMENT_TYPES = new Set<string>(["text/plain"]);

export const MAX_CHAT_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ChatUploadValidationResult =
  | { valid: true }
  | { valid: false; kind: "pdf" }
  | { valid: false; kind: "reject"; error: string };

export function validateChatUpload(file: File): ChatUploadValidationResult {
  const effectiveType = resolveUploadedMimeType(file);

  // PDF is allowed in the file picker; we do not upload it—client shows OCR modal.
  if (isPdfAttachment(effectiveType, file.name)) {
    return { valid: false, kind: "pdf" };
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(effectiveType)) {
    return {
      valid: false,
      kind: "reject",
      error: `File type "${file.type || "(empty)"}" is not allowed. You can upload plain text (.txt), or choose a PDF to open the OCR conversion helper—other types are not supported.`,
    };
  }

  if (file.size > MAX_CHAT_UPLOAD_BYTES) {
    return {
      valid: false,
      kind: "reject",
      error: "File size exceeds 10MB limit.",
    };
  }

  return { valid: true };
}
