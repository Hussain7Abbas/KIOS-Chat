"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Layers, Upload, Shield, Zap, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"

export function Features() {
  const { t } = useTranslation()

  const features = useMemo(
    () =>
      [
        {
          icon: Bot,
          titleKey: "features.multiple-models-title",
          descKey: "features.multiple-models-desc",
        },
        {
          icon: Layers,
          titleKey: "features.custom-agent-title",
          descKey: "features.custom-agent-desc",
        },
        {
          icon: Upload,
          titleKey: "features.attachments-title",
          descKey: "features.attachments-desc",
        },
        {
          icon: Shield,
          titleKey: "features.rbac-title",
          descKey: "features.rbac-desc",
        },
        {
          icon: Zap,
          titleKey: "features.streaming-title",
          descKey: "features.streaming-desc",
        },
        {
          icon: Globe,
          titleKey: "features.threads-title",
          descKey: "features.threads-desc",
        },
      ] as const,
    [],
  )

  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("features.section-title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("features.section-subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{t(feature.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
