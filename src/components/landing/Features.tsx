"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Layers, Upload, Shield, Zap, Globe } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Bot,
    title: "Multiple AI Models",
    description:
      "Access GPT-4o, Claude, Gemini, Llama, Mistral, and more through a single interface.",
  },
  {
    icon: Layers,
    title: "Custom Agent Prompt",
    description:
      "Configure a system prompt to personalize your AI assistant's behavior and tone.",
  },
  {
    icon: Upload,
    title: "File Attachments",
    description:
      "Upload images and documents directly into your conversations for context-aware responses.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Secure admin dashboard with user management, usage stats, and subscription controls.",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description:
      "See responses appear word by word with live streaming for a natural conversation feel.",
  },
  {
    icon: Globe,
    title: "Thread Management",
    description:
      "Organize your conversations with thread creation, renaming, archiving, and deletion.",
  },
]

export function Features() {
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
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A complete AI chat platform with powerful features built for
            productivity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
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
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
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
