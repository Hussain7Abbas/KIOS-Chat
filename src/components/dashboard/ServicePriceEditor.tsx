"use client"

import { useState } from "react"
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
  const [threadPrice, setThreadPrice] = useState(String(initialThreadPrice))
  const [isPending, setIsPending] = useState(false)

  const parsed = Number.parseInt(threadPrice, 10)
  const isValid = !Number.isNaN(parsed) && parsed >= 0

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Enter a whole number 0 or greater")
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
      toast.success("Thread price updated")
    } catch {
      toast.error("Failed to save thread price")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service prices</CardTitle>
        <CardDescription>
          Set how many coins each system service costs. Thread price applies when a user creates a new chat thread.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="thread-price">Thread (coins)</Label>
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
            <span className="text-sm text-muted-foreground">Preview</span>
            {parsed === 0 ? (
              <Badge className="bg-green-600 hover:bg-green-600">Free</Badge>
            ) : (
              <span className="text-sm font-medium">
                {parsed} coin{parsed === 1 ? "" : "s"} per thread
              </span>
            )}
          </div>
        </div>
        <Button type="button" onClick={handleSave} disabled={isPending || !isValid}>
          Save
        </Button>
      </CardContent>
    </Card>
  )
}
