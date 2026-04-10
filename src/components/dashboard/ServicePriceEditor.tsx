"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { THREAD_PRICE_SETTING_KEY } from "@/lib/pricing-constants"

interface ServicePriceEditorProps {
  initialThreadPrice: number
}

export function ServicePriceEditor({ initialThreadPrice }: ServicePriceEditorProps) {
  const { t } = useTranslation()
  const [threadPrice, setThreadPrice] = useState(String(initialThreadPrice))
  const [isPending, setIsPending] = useState(false)

  const parsed = Number.parseInt(threadPrice, 10)
  const isValid = !Number.isNaN(parsed) && parsed >= 0

  const handleSave = async () => {
    if (!isValid) {
      toast.error(t("service-price.thread-invalid"))
      return
    }
    setIsPending(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: THREAD_PRICE_SETTING_KEY,
          value: String(parsed),
        }),
      })
      if (!res.ok) {
        throw new Error("Save failed")
      }
      toast.success(t("service-price.thread-updated"))
    } catch {
      toast.error(t("service-price.thread-save-failed"))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("service-price.card-title")}</CardTitle>
        <CardDescription>
          {t("service-price.card-desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="thread-price">{t("service-price.thread-label")}</Label>
            <Input
              id="thread-price"
              type="number"
              min={0}
              step={1}
              value={threadPrice}
              onChange={(e) => setThreadPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <span className="text-sm text-muted-foreground">{t("common.preview")}</span>
            {parsed === 0 ? (
              <Badge className="bg-green-600 hover:bg-green-600">{t("common.free")}</Badge>
            ) : (
              <span className="text-sm font-medium">
                {parsed === 1
                  ? t("service-price.per-thread-singular", { count: parsed })
                  : t("service-price.per-thread-many", { count: parsed })}
              </span>
            )}
          </div>
        </div>
        <Button type="button" onClick={handleSave} disabled={isPending || !isValid}>
          {t("service-price.save")}
        </Button>
      </CardContent>
    </Card>
  )
}
