"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

interface SubscriptionCardProps {
  coins: number
  price: number
  label: string
  isPopular?: boolean
  onPurchase: () => void
  isPending?: boolean
}

export function SubscriptionCard({
  coins,
  price,
  label,
  isPopular,
  onPurchase,
  isPending,
}: SubscriptionCardProps) {
  const { t } = useTranslation()
  const formattedPrice = (price / 100).toFixed(2)

  return (
    <Card
      className={`relative ${
        isPopular ? "border-primary shadow-lg shadow-primary/10" : ""
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 start-1/2 -translate-x-1/2">
          <Badge className="gap-1">
            <Zap className="h-3 w-3" />
            {t("subscription.most-popular")}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{label}</CardTitle>
        <CardDescription>{coins} {t("common.coins")}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div>
          <span className="text-3xl font-bold">${formattedPrice}</span>
          <span className="text-muted-foreground text-sm ms-1">{t("subscription.one-time-label")}</span>
        </div>

        <ul className="space-y-2 text-sm text-start">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t("subscription.coins-added", { count: coins })}</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t("subscription.feature-all-models")}</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t("subscription.feature-attachments")}</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{t("subscription.feature-no-expire")}</span>
          </li>
        </ul>

        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          onClick={onPurchase}
          disabled={isPending}
        >
          {t("common.purchase")}
        </Button>
      </CardContent>
    </Card>
  )
}
