"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
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
  const { t, i18n } = useTranslation()
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
          toast.error(err?.error ?? t("agent-editor.model-pref-failed"))
          return
        }
        await refetchSession()
      } catch {
        toast.error(t("agent-editor.model-pref-failed"))
      }
    },
    [refetchSession, t],
  )

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAgentPromptAction(prompt)
      if (!result.ok) {
        const maxStr =
          result.maxChars != null
            ? result.maxChars.toLocaleString(i18n.language === "ar" ? "ar" : "en-US")
            : ""
        toast.error(t(result.errorKey, { max: maxStr }))
      } else {
        toast.success(t("agent-editor.prompt-saved"))
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("agent-editor.system-prompt-title")}</CardTitle>
          <CardDescription>
            {t("agent-editor.system-prompt-desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("agent-editor.main-model-label")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("agent-editor.main-model-hint")}
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
            placeholder={t("agent-editor.placeholder-prompt")}
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
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {t("agent-editor.save-prompt")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
