"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

interface HeroProps {
  isAuthenticated: boolean
}

export function Hero({ isAuthenticated }: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 start-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/4 h-[300px] w-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          {t("hero.badge")}
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            {t("hero.title-line-1")}
          </span>
          <br />
          <span className="bg-gradient-to-r from-zinc-500 via-zinc-300 to-white bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            {t("hero.title-line-2")}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {isAuthenticated ? (
            <Button size="lg" render={<Link href="/chat" />} className="text-base px-8">
              <>
                {t("hero.go-to-chat")}
                <ArrowRight className="ms-2 h-5 w-5" />
              </>
            </Button>
          ) : (
            <>
              <Button size="lg" render={<Link href="/register" />} className="text-base px-8">
                <>
                  {t("hero.get-started-free")}
                  <ArrowRight className="ms-2 h-5 w-5" />
                </>
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/login" />} className="text-base">
                {t("hero.sign-in")}
              </Button>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-8 mt-16 text-sm text-muted-foreground"
        >
          <div>
            <span className="text-2xl font-bold text-foreground block">
              10+
            </span>
            {t("hero.stat-models")}
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-2xl font-bold text-foreground block">3</span>
            {t("hero.stat-free-coins")}
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-2xl font-bold text-foreground block">∞</span>
            {t("hero.stat-messages")}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
