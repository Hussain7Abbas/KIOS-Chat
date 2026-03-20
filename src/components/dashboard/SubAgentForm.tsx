"use client"

import { useState } from "react"
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

interface SubAgentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: SubAgentDto | null
}

export function SubAgentForm({ open, onOpenChange, editing }: SubAgentFormProps) {
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
        type: p.type as "string" | "number" | "boolean",
        description: p.description,
        required: p.required,
      }))
      : []
  )

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
    }

    const parsed = createSubAgentSchema.safeParse(payload)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      toast.error(first ?? "Invalid form")
      return
    }

    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          payload: parsed.data,
        })
        toast.success("Sub-agent updated")
      } else {
        await createMut.mutateAsync(parsed.data)
        toast.success("Sub-agent created")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed")
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit sub-agent" : "New sub-agent"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subagent-name">Tool name</Label>
              <Input
                id="subagent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Translator"
                disabled={!!editing}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used as the function name the main agent calls. Cannot be
                changed after creation.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subagent-instructions">Instructions</Label>
              <Textarea
                id="subagent-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                className="font-mono text-sm min-h-[140px]"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Model</Label>
              <ModelSelector value={model} onChange={setModel} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subagent-format">Output format</Label>
              <select
                id="subagent-format"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={outputFormat}
                onChange={(e) =>
                  setOutputFormat(e.target.value as typeof outputFormat)
                }
              >
                <option value="text">Plain text</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parameters (Input)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParam}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add param
                </Button>
              </div>
              {params.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No parameters — the tool accepts an empty object.
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
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              updateParam(row.key, { name: e.target.value })
                            }
                            placeholder="language"
                          />
                        </div>
                        <div className="w-28 grid gap-1">
                          <Label className="text-xs">Type</Label>
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
                          aria-label="Remove parameter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Description</Label>
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
                        Required
                      </label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editing ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
