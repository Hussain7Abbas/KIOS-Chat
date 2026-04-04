"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useTranslation } from "react-i18next"

export function CTA() {
  const { t } = useTranslation()

  return (
    <section className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-12">
          <h2 className="text-3xl font-bold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            {t("cta.subtitle")}
          </p>
          <Button size="lg" render={<Link href="/register" />} className="text-base px-8">
            <>
              {t("cta.button")}
              <ArrowRight className="ms-2 h-5 w-5" />
            </>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
