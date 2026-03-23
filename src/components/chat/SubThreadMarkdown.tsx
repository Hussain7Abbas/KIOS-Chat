"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { markdownProseClassName } from "@/lib/markdownProse"
import { cn } from "@/lib/utils"

/**
 * Markdown for sub-thread bubbles only: GFM, no rehype-highlight (avoids lowlight /
 * highlight.js bundling issues that can throw e.g. "Cannot read properties of undefined (reading 'create')").
 */
export function SubThreadMarkdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn(markdownProseClassName(undefined, { compact: true }), className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
