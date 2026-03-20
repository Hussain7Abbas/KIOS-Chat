import type { OpenRouterFileParserPlugin } from "@/lib/openrouter";

const PDF_ENGINES = ["pdf-text", "mistral-ocr", "native"] as const;

export type OpenRouterPdfParserEngine = (typeof PDF_ENGINES)[number];

const MAX_PDF_BYTES = 10 * 1024 * 1024;

async function fetchUrlBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch PDF (${res.status})`);
  }
  return res.arrayBuffer();
}

/**
 * PDF parsing engine for OpenRouter `plugins` (see OpenRouter multimodal PDFs).
 * Override with `OPENROUTER_PDF_ENGINE` (`pdf-text` | `mistral-ocr` | `native`).
 */
export function parseOpenRouterPdfEngineFromEnv(): OpenRouterPdfParserEngine {
  const raw = process.env.OPENROUTER_PDF_ENGINE?.trim().toLowerCase();
  if (raw && (PDF_ENGINES as readonly string[]).includes(raw)) {
    return raw as OpenRouterPdfParserEngine;
  }
  return "mistral-ocr";
}

export function createOpenRouterPdfParserPlugin(): OpenRouterFileParserPlugin {
  return {
    id: "file-parser",
    pdf: { engine: parseOpenRouterPdfEngineFromEnv() },
  };
}

/**
 * When `OPENROUTER_PDF_FILE_DATA=base64`, PDFs are sent as
 * `data:application/pdf;base64,...` (local/private-friendly). Default is `url`
 * (public HTTPS `file_data`, e.g. ImageKit).
 */
export function openRouterPdfUsesBase64FileData(): boolean {
  return (
    process.env.OPENROUTER_PDF_FILE_DATA?.trim().toLowerCase() === "base64"
  );
}

/**
 * Value for OpenRouter `content[].file.file_data`: public URL or PDF data URL.
 */
export async function resolveOpenRouterPdfFileData(params: {
  url: string;
  sizeBytes?: number;
}): Promise<string> {
  if (!openRouterPdfUsesBase64FileData()) {
    return params.url;
  }
  if (params.sizeBytes !== undefined && params.sizeBytes > MAX_PDF_BYTES) {
    return params.url;
  }
  try {
    const buffer = await fetchUrlBytes(params.url);
    if (buffer.byteLength > MAX_PDF_BYTES) {
      return params.url;
    }
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:application/pdf;base64,${base64}`;
  } catch {
    return params.url;
  }
}
