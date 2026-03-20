"use client"

import "highlight.js/styles/github-dark.css"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

interface ResponseMarkdownProps {
  children: string
}

/**
 * Renders assistant / model output as Markdown (CommonMark + GFM) with fenced code highlighting.
 * @see https://github.com/remarkjs/react-markdown
 */
export function ResponseMarkdown({ children }: ResponseMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
    >
      {children}
    </ReactMarkdown>
  )
}
