import type { ChatCompletionContentPart } from "openai/resources/chat/completions"
import { isPdfAttachment } from "@/lib/mime"
import { resolveOpenRouterPdfFileData } from "@/lib/openRouterPdf"

export interface FileForChat {
  url: string
  mimeType: string
  name: string
  /** Byte size from upload; used when sending PDFs as base64 to OpenRouter. */
  size?: number
}

const MAX_TEXT_ATTACHMENT_CHARS = 120_000

function isImageMime(mime: string): boolean {
  return /^image\/(jpeg|png|gif|webp)$/i.test(mime)
}

async function fetchUrlBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) {
    throw new Error(`Failed to fetch file (${res.status})`)
  }
  return res.arrayBuffer()
}

async function extractTextFileFromUrl(
  url: string,
  mimeType: string
): Promise<string> {
  const buffer = await fetchUrlBytes(url)
  if (mimeType.startsWith("text/") || mimeType === "application/csv") {
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim()
  }
  return ""
}

/**
 * Builds user message content for OpenRouter:
 * - PDFs: OpenRouter `type: "file"` parts (`filename` + `file_data`). `file_data` is a
 *   public URL by default, or `data:application/pdf;base64,...` when `OPENROUTER_PDF_FILE_DATA=base64`.
 * - Images: `image_url` parts.
 * - Plain text / CSV: fetched server-side and inlined (small text formats only).
 */
export async function buildUserMessageContent(
  textContent: string,
  files: FileForChat[]
): Promise<string | ChatCompletionContentPart[]> {
  if (!files.length) {
    return textContent
  }

  const textDocSections: string[] = []
  const imageParts: ChatCompletionContentPart[] = []
  const pdfParts: ChatCompletionContentPart[] = []

  for (const file of files) {
    if (isImageMime(file.mimeType)) {
      imageParts.push({
        type: "image_url",
        image_url: { url: file.url },
      })
      continue
    }

    if (isPdfAttachment(file.mimeType, file.name)) {
      const fileData = await resolveOpenRouterPdfFileData({
        url: file.url,
        sizeBytes: file.size,
      })
      pdfParts.push({
        type: "file",
        file: {
          filename: file.name,
          file_data: fileData,
        },
      })
      continue
    }

    try {
      const extracted = await extractTextFileFromUrl(file.url, file.mimeType)
      if (extracted) {
        const clipped =
          extracted.length > MAX_TEXT_ATTACHMENT_CHARS
            ? `${extracted.slice(0, MAX_TEXT_ATTACHMENT_CHARS)}\n\n[…truncated]`
            : extracted
        textDocSections.push(
          `--- Attached file: ${file.name} (${file.mimeType}) ---\n${clipped}`
        )
      } else {
        textDocSections.push(
          `--- Attached file: ${file.name} (${file.mimeType}) ---\n[Unsupported or empty text file.]`
        )
      }
    } catch {
      textDocSections.push(
        `--- Attached file: ${file.name} (${file.mimeType}) ---\n[Failed to load file content.]`
      )
    }
  }

  const docBlock =
    textDocSections.length > 0 ? `\n\n${textDocSections.join("\n\n")}` : ""
  const combinedText = `${textContent}${docBlock}`.trim()

  if (imageParts.length === 0 && pdfParts.length === 0) {
    return combinedText || textContent
  }

  const parts: ChatCompletionContentPart[] = [
    { type: "text", text: combinedText || "(attachment)" },
    ...imageParts,
    ...pdfParts,
  ]
  return parts
}
