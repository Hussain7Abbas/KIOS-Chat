import { cn } from "@/lib/utils"

type MarkdownProseOptions = {
  /** Smaller typography (e.g. sub-agent panel); skips `md:prose-base`. */
  compact?: boolean
}

/**
 * Prose wrapper classes for react-markdown: @tailwindcss/typography + shadcn theme tokens.
 */
export function markdownProseClassName(
  extra?: string,
  options?: MarkdownProseOptions
) {
  const { compact = false } = options ?? {}
  return cn(
    "prose prose-sm max-w-none dark:prose-invert",
    !compact && "md:prose-base",
    "prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
    "prose-p:leading-relaxed prose-p:text-foreground",
    "prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4",
    "prose-strong:text-foreground",
    "prose-blockquote:border-border prose-blockquote:text-muted-foreground",
    "prose-code:rounded-md prose-code:bg-muted/80 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-4",
    "prose-hr:border-border",
    "prose-li:marker:text-muted-foreground",
    "prose-table:text-foreground prose-th:border-border prose-td:border-border",
    extra
  )
}
