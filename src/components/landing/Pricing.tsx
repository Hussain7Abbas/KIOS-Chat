"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import type { CoinPackageData } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "react-i18next"

interface PricingApiResponse {
  threadPrice: number
  coinPackages: CoinPackageData[]
}

async function fetchPricing(): Promise<PricingApiResponse> {
  const res = await fetch("/api/pricing")
  if (!res.ok) throw new Error("Failed to load pricing")
  return res.json()
}

function formatUsd(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(2)}`
}

export function Pricing() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-pricing"],
    queryFn: fetchPricing,
  })

  const threadPrice = data?.threadPrice ?? 1
  const packages = data?.coinPackages ?? []

  const commonFeatureKeys = [
    "pricing.feature-pay-as-you-go",
    "pricing.feature-no-expire",
    "pricing.feature-no-subscription",
    "pricing.feature-unlimited-messages",
  ] as const

  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("pricing.section-title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            {t("pricing.section-subtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("pricing.thread-cost-label")}</span>
            {threadPrice === 0 ? (
              <Badge className="bg-green-600 hover:bg-green-600">{t("common.free")}</Badge>
            ) : (
              <Badge variant="secondary">
                {threadPrice === 1
                  ? t("pricing.thread-per-singular", { count: threadPrice })
                  : t("pricing.thread-per-many", { count: threadPrice })}
              </Badge>
            )}
          </div>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-destructive">
            {t("pricing.load-error")}
          </p>
        )}

        {!isLoading && !isError && packages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">
            {t("pricing.not-configured")}
          </p>
        )}

        {!isLoading && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card
                  className={`relative h-full ${
                    tier.isPopular
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-border/50"
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                      <Badge className="gap-1">
                        <Zap className="h-3 w-3" />
                        {t("pricing.most-popular")}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-lg mb-2">{tier.label}</CardTitle>
                    <div>
                      <span className="text-4xl font-bold">
                        {formatUsd(tier.priceInCents)}
                      </span>
                      <span className="text-muted-foreground"> {t("pricing.one-time")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("pricing.adds-coins", { count: tier.coins })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2.5">
                      {commonFeatureKeys.map((key) => (
                        <li
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {t(key)}
                        </li>
                      ))}
                    </ul>
                    <Link href="/register" className="block w-full">
                      <Button
                        className="w-full mt-2"
                        variant={tier.isPopular ? "default" : "outline"}
                      >
                        {t("pricing.get-package", { label: tier.label })}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
