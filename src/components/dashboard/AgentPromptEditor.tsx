"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { saveAgentPromptAction } from "@/app/actions/agent.actions"
import { useInstructionContextLimit } from "@/hooks/useInstructionContextLimit"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModelSelector } from "@/components/chat/ModelSelector"
import { useSession } from "@/lib/auth-client"
import { InstructionContextLimitLines } from "@/components/dashboard/InstructionContextLimitLines"
import { Loader2, Save, Bot, User } from "lucide-react"
import { toast } from "sonner"

interface AgentPromptEditorProps {
  initialPrompt: string | null
  initialPreferredModel: string
}

export function AgentPromptEditor({
  initialPrompt,
  initialPreferredModel,
}: AgentPromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "")
  const [preferredModel, setPreferredModel] = useState(initialPreferredModel)
  const [isPending, startTransition] = useTransition()
  const { refetch: refetchSession } = useSession()

  const {
    limitInfo,
    maxChars,
    contextTokens,
    limitQueryPending,
    limitQueryError,
    overLimit,
  } = useInstructionContextLimit(preferredModel, prompt.length)

  useEffect(() => {
    setPreferredModel(initialPreferredModel)
  }, [initialPreferredModel])

  const persistPreferredModel = useCallback(
    async (model: string) => {
      setPreferredModel(model)
      try {
        const res = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredModel: model }),
        })
        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          toast.error(err?.error ?? "Could not save model preference")
          return
        }
        await refetchSession()
      } catch {
        toast.error("Could not save model preference")
      }
    },
    [refetchSession]
  )

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAgentPromptAction(prompt)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Agent prompt saved successfully")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Prompt</CardTitle>
          <CardDescription>
            This prompt will be prepended to every conversation as the system
            message. It defines your AI agent&apos;s personality and behavior.
            Maximum size follows the selected main chat model&apos;s context from
            OpenRouter (characters are an estimate; space is reserved for the
            thread).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Main chat model</Label>
            <p className="text-xs text-muted-foreground">
              OpenRouter model used for the main agent in every thread. Change
              it here instead of in the chat view.
            </p>
            <ModelSelector
              value={preferredModel}
              onChange={persistPreferredModel}
              className="w-full max-w-[min(100%,280px)]"
            />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant specialized in..."
            rows={12}
            className="resize-y min-h-[240px] font-mono text-sm"
            maxLength={maxChars ?? undefined}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <InstructionContextLimitLines
              charCount={prompt.length}
              maxChars={maxChars}
              contextTokens={contextTokens}
              limitInfo={limitInfo}
              limitQueryPending={limitQueryPending}
              limitQueryError={limitQueryError}
            />
            <Button
              onClick={handleSave}
              disabled={isPending || overLimit}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Preview
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          </CardTitle>
          <CardDescription>
            See how your agent will respond with this system prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-4">
            {prompt && (
              <div className="flex gap-3 text-sm text-muted-foreground italic">
                <Bot className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="truncate">
                  System: {prompt.slice(0, 150)}
                  {prompt.length > 150 ? "..." : ""}
                </p>
              </div>
            )}
            <div className="flex gap-3 text-sm">
              <User className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
              <p>Hello, can you help me?</p>
            </div>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Bot className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                {prompt
                  ? "I'll respond based on the persona defined in the system prompt above."
                  : "No system prompt configured. I'll respond with default behavior."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
