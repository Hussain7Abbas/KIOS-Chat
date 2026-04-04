"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { InstructionContextLimitLines } from "@/components/dashboard/InstructionContextLimitLines"
import { useInstructionContextLimit } from "@/hooks/useInstructionContextLimit"
import { createSubAgentSchema } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ModelSelector } from "@/components/chat/ModelSelector"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { SubAgentDto } from "@/hooks/useSubAgents"
import {
  useCreateSubAgent,
  useUpdateSubAgent,
} from "@/hooks/useSubAgents"

type ParamRow = {
  key: string
  name: string
  type: "string" | "number" | "boolean"
  description: string
  required: boolean
}

type OutputParamRow = {
  key: string
  name: string
  type: "string" | "number" | "boolean"
  description: string
}

const defaultModel =
  process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"

function emptyParamRow(): ParamRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: true,
  }
}

function emptyOutputParamRow(): OutputParamRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
  }
}

function normalizeParamType(
  raw: string,
): "string" | "number" | "boolean" {
  if (raw === "number" || raw === "boolean") return raw
  return "string"
}

interface SubAgentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: SubAgentDto | null
}

export function SubAgentForm({ open, onOpenChange, editing }: SubAgentFormProps) {
  const { t } = useTranslation()
  const createMut = useCreateSubAgent()
  const updateMut = useUpdateSubAgent()

  const [name, setName] = useState(() => editing?.name ?? "")
  const [instructions, setInstructions] = useState(
    () => editing?.instructions ?? ""
  )
  const [model, setModel] = useState(() => editing?.model ?? defaultModel)
  const [outputFormat, setOutputFormat] = useState<
    "text" | "json" | "markdown"
  >(() => (editing?.outputFormat as "text" | "json" | "markdown") ?? "text")
  const [params, setParams] = useState<ParamRow[]>(() =>
    editing
      ? editing.params.map((p) => ({
          key: p.id,
          name: p.name,
          type: normalizeParamType(p.type),
          description: p.description,
          required: p.required,
        }))
      : []
  )
  const [outputParams, setOutputParams] = useState<OutputParamRow[]>(() =>
    editing
      ? (editing.outputParams ?? []).map((p) => ({
          key: p.id,
          name: p.name,
          type: normalizeParamType(p.type),
          description: p.description,
        }))
      : []
  )

  const {
    limitInfo,
    maxChars,
    contextTokens,
    limitQueryPending,
    limitQueryError,
    overLimit,
  } = useInstructionContextLimit(model, instructions.length)

  const addParam = () => {
    setParams((p) => [...p, emptyParamRow()])
  }

  const removeParam = (key: string) => {
    setParams((p) => p.filter((row) => row.key !== key))
  }

  const updateParam = (key: string, patch: Partial<ParamRow>) => {
    setParams((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )
  }

  const addOutputParam = () => {
    setOutputParams((p) => [...p, emptyOutputParamRow()])
  }

  const removeOutputParam = (key: string) => {
    setOutputParams((p) => p.filter((row) => row.key !== key))
  }

  const updateOutputParam = (key: string, patch: Partial<OutputParamRow>) => {
    setOutputParams((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      instructions: instructions.trim(),
      model,
      outputFormat,
      params: params.map((r) => ({
        name: r.name.trim(),
        type: r.type,
        description: r.description.trim(),
        required: r.required,
      })),
      outputParams: outputParams.map((r) => ({
        name: r.name.trim(),
        type: r.type,
        description: r.description.trim(),
      })),
    }

    const parsed = createSubAgentSchema.safeParse(payload)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      toast.error(first ? t(first) : t("subagent.invalid-form"))
      return
    }

    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          payload: parsed.data,
        })
        toast.success(t("subagent.updated"))
      } else {
        await createMut.mutateAsync(parsed.data)
        toast.success(t("subagent.created"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[SubAgentForm] save failed", err)
      toast.error(err instanceof Error ? err.message : t("subagent.request-failed"))
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("subagent.form-edit") : t("subagent.form-new")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subagent-name">{t("subagent.tool-name")}</Label>
              <Input
                id="subagent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("subagent.tool-name-placeholder")}
                disabled={!!editing}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("subagent.tool-name-hint")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>{t("subagent.form-model-label")}</Label>
              <ModelSelector
                value={model}
                onChange={setModel}
                inModal
                className="w-full max-w-[min(100%,280px)]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subagent-instructions">{t("subagent.instructions")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("subagent.form-instructions-hint")}
              </p>
              <Textarea
                id="subagent-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                className="font-mono text-sm min-h-[140px]"
                maxLength={maxChars ?? undefined}
                required
              />
              <InstructionContextLimitLines
                charCount={instructions.length}
                maxChars={maxChars}
                contextTokens={contextTokens}
                limitInfo={limitInfo}
                limitQueryPending={limitQueryPending}
                limitQueryError={limitQueryError}
                size="compact"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("subagent.input-params-section")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParam}
                >
                  <Plus className="h-4 w-4 me-1" />
                  {t("subagent.add-input")}
                </Button>
              </div>
              {params.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("subagent.no-input-params")}
                </p>
              ) : (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  {params.map((row) => (
                    <div
                      key={row.key}
                      className="grid gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 grid gap-1">
                          <Label className="text-xs">{t("subagent.param-name")}</Label>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              updateParam(row.key, { name: e.target.value })
                            }
                            placeholder="language"
                          />
                        </div>
                        <div className="w-28 grid gap-1">
                          <Label className="text-xs">{t("subagent.param-type")}</Label>
                          <select
                            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                            value={row.type}
                            onChange={(e) =>
                              updateParam(row.key, {
                                type: e.target.value as ParamRow["type"],
                              })
                            }
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeParam(row.key)}
                          aria-label={t("subagent.remove-input-aria")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">{t("subagent.param-description")}</Label>
                        <Input
                          value={row.description}
                          onChange={(e) =>
                            updateParam(row.key, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Target natural language"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="size-4 rounded border border-input"
                          checked={row.required}
                          onChange={(e) =>
                            updateParam(row.key, {
                              required: e.target.checked,
                            })
                          }
                        />
                        {t("subagent.param-required")}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subagent-response-format">{t("subagent.response-format-label")}</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                {t("subagent.response-format-hint")}
              </p>
              <select
                id="subagent-response-format"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={outputFormat}
                onChange={(e) =>
                  setOutputFormat(e.target.value as typeof outputFormat)
                }
              >
                <option value="text">{t("subagent.format-plain")}</option>
                <option value="markdown">{t("subagent.format-markdown")}</option>
                <option value="json">{t("subagent.format-json")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>{t("subagent.output-fields-title")}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("subagent.output-fields-hint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={addOutputParam}
                >
                  <Plus className="h-4 w-4 me-1" />
                  {t("subagent.add-output")}
                </Button>
              </div>
              {outputParams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("subagent.no-output-fields")}
                </p>
              ) : (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  {outputParams.map((row) => (
                    <div
                      key={row.key}
                      className="grid gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 grid gap-1">
                          <Label className="text-xs">{t("subagent.field-name-label")}</Label>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              updateOutputParam(row.key, {
                                name: e.target.value,
                              })
                            }
                            placeholder="summary"
                          />
                        </div>
                        <div className="w-28 grid gap-1">
                          <Label className="text-xs">{t("subagent.param-type")}</Label>
                          <select
                            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                            value={row.type}
                            onChange={(e) =>
                              updateOutputParam(row.key, {
                                type: e.target.value as OutputParamRow["type"],
                              })
                            }
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeOutputParam(row.key)}
                          aria-label={t("subagent.remove-output-aria")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">{t("subagent.param-description")}</Label>
                        <Input
                          value={row.description}
                          onChange={(e) =>
                            updateOutputParam(row.key, {
                              description: e.target.value,
                            })
                          }
                          placeholder="One-line summary of the result"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("subagent.dialog-cancel")}
            </Button>
            <Button type="submit" disabled={pending || overLimit}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editing ? (
                t("subagent.dialog-save")
              ) : (
                t("subagent.dialog-create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
