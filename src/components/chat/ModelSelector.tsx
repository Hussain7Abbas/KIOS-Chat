"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CHAT_MODELS_FALLBACK,
  findChatModelName,
  type ChatModelsByProvider,
} from "@/lib/chatModelsCatalog"

async function fetchChatModels(): Promise<ChatModelsByProvider> {
  const res = await fetch("/api/models", { credentials: "include" })
  if (!res.ok) throw new Error("Failed to load models")
  const body = (await res.json()) as unknown
  if (!body || typeof body !== "object") throw new Error("Invalid response")
  const o = body as Record<string, unknown>
  for (const k of ["openai", "anthropic", "google"] as const) {
    if (!Array.isArray(o[k])) throw new Error("Invalid response shape")
  }
  return body as ChatModelsByProvider
}

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  /** Use inside a dialog so the model list appears above the modal */
  inModal?: boolean
  className?: string
}

export function ModelSelector({
  value,
  onChange,
  inModal = false,
  className,
}: ModelSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const modelGroups = useMemo(
    () =>
      [
        { key: "openai" as const, headingKey: "chat.models-group-openai" },
        { key: "anthropic" as const, headingKey: "chat.models-group-anthropic" },
        { key: "google" as const, headingKey: "chat.models-group-google" },
      ] as const,
    [],
  )

  const { data, isPending, isError } = useQuery({
    queryKey: ["openrouter-chat-models"],
    queryFn: fetchChatModels,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })

  const catalog: ChatModelsByProvider =
    data != null && !isError ? data : CHAT_MODELS_FALLBACK

  const displayName =
    findChatModelName(catalog, value) ??
    value.split("/").pop() ??
    t("chat.select-model")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-[200px] justify-between text-sm", className)}
          >
            <span className="truncate">{displayName}</span>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-[min(100vw-2rem,380px)] p-0"
        align="start"
        inModal={inModal}
      >
        {isPending ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {t("chat.models-loading-catalog")}
          </p>
        ) : null}
        <Command>
          <CommandInput placeholder={t("chat.models-search")} />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty>{t("chat.models-empty")}</CommandEmpty>
            {modelGroups.map(({ key, headingKey }) => {
              const models = catalog[key]
              if (models.length === 0) return null
              return (
                <CommandGroup key={key} heading={t(headingKey)}>
                  {models.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={`${model.name} ${model.id}`}
                      onSelect={() => {
                        onChange(model.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "me-2 h-4 w-4 shrink-0",
                          value === model.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{model.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
