import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export const metadata: Metadata = {
  title: "Create Account — KIOS Chat",
  description: "Create your KIOS Chat account",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-10">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      <RegisterForm />
    </div>
  )
}
