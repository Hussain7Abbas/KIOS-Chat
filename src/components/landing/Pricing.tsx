"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const tiers = [
  {
    name: "Starter Bundle",
    threads: 10,
    price: "$4.99",
    popular: false,
  },
  {
    name: "Pro Bundle",
    threads: 50,
    price: "$19.99",
    popular: true,
  },
  {
    name: "Enterprise Bundle",
    threads: 100,
    price: "$34.99",
    popular: false,
  },
]

const commonFeatures = [
  "Pay only for what you use",
  "Threads never expire",
  "No recurring subscriptions",
  "Unlimited messages per thread",
]

export function Pricing() {
  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pay-as-you-go Thread Packages
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Zero recurring subscriptions. Zero hidden fees. You simply buy individual chat threads as you need them and they never expire.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card
                className={`relative h-full ${
                  tier.popular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-lg mb-2">{tier.name}</CardTitle>
                  <div>
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground"> / one-time</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adds {tier.threads} permanent threads
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {commonFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block w-full">
                    <Button
                      className="w-full mt-2"
                      variant={tier.popular ? "default" : "outline"}
                    >
                      Buy {tier.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
