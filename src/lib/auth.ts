import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"

function buildTrustedOrigins(): string[] {
  const origins = new Set<string>()
  origins.add(new URL(env.BETTER_AUTH_URL).origin)
  origins.add(new URL(env.NEXT_PUBLIC_APP_URL).origin)
  if (process.env.NODE_ENV === "development") {
    for (const port of ["3000", "3001", "3002", "3003"]) {
      origins.add(`http://localhost:${port}`)
      origins.add(`http://127.0.0.1:${port}`)
    }
  }
  return [...origins]
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: buildTrustedOrigins(),

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      coinsBalance: {
        type: "number",
        defaultValue: 3,
        input: false,
      },
      coinsPurchased: {
        type: "number",
        defaultValue: 0,
        input: false,
      },
      agentPrompt: {
        type: "string",
        required: false,
        input: false,
      },
      preferredModel: {
        type: "string",
        defaultValue: process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini",
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
