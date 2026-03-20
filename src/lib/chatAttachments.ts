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
 * - PDFs (legacy uploads): OpenRouter `type: "file"` parts.
 * - Plain text: fetched server-side and inlined.
 * - Images are not supported for new uploads; legacy image files are described in text only.
 */
export async function buildUserMessageContent(
  textContent: string,
  files: FileForChat[]
): Promise<string | ChatCompletionContentPart[]> {
  if (!files.length) {
    return textContent
  }

  const textDocSections: string[] = []
  const pdfParts: ChatCompletionContentPart[] = []

  for (const file of files) {
    if (file.mimeType.startsWith("image/")) {
      textDocSections.push(
        `--- Attached file: ${file.name} (${file.mimeType}) ---\n[Image attachments are not supported in chat. Ask the user to describe the image or paste text.]`
      )
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

  if (pdfParts.length === 0) {
    return combinedText || textContent
  }

  const parts: ChatCompletionContentPart[] = [
    { type: "text", text: combinedText || "(attachment)" },
    ...pdfParts,
  ]
  return parts
}
