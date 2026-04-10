import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/LoginForm"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export const metadata: Metadata = {
  title: "Sign In — KIOS Chat",
  description: "Sign in to your KIOS Chat account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-10">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      <LoginForm />
    </div>
  )
}
