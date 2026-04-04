import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { Pricing } from "@/components/landing/Pricing"
import { CTA } from "@/components/landing/CTA"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default async function LandingPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)

  const isAuthenticated = !!session
  const isAdmin = session?.user?.role === "admin"

  return (
    <div className="min-h-screen">
      <LandingNavbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />

      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <Features />
        <Pricing />
        <CTA />
      </main>

      <LandingFooter />
    </div>
  )
}
