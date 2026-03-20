"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function CTA() {
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
            Ready to start chatting?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Create your account and get 3 free threads to explore all the
            AI models we offer.
          </p>
          <Button size="lg" render={<Link href="/register" />} className="text-base px-8">
            <>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
