"use client"

import { useState, useTransition } from "react"
import { saveAgentPromptAction } from "@/app/actions/agent.actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Bot, User } from "lucide-react"
import { toast } from "sonner"

interface AgentPromptEditorProps {
  initialPrompt: string | null
}

export function AgentPromptEditor({ initialPrompt }: AgentPromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "")
  const [isPending, startTransition] = useTransition()
  const maxLength = 5000

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
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant specialized in..."
            rows={12}
            className="resize-y min-h-[240px] font-mono text-sm"
            maxLength={maxLength}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {prompt.length}/{maxLength} characters
            </p>
            <Button onClick={handleSave} disabled={isPending}>
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
