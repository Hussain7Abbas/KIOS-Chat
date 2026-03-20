import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { Pricing } from "@/components/landing/Pricing"
import { CTA } from "@/components/landing/CTA"
import { Button } from "@/components/ui/button"
import { MessageSquare, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default async function LandingPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)

  const isAuthenticated = !!session
  const isAdmin = session?.user?.role === "admin"

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            KIOS Chat
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                  <>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </>
                </Button>
                )}
                <Button size="sm" render={<Link href="/chat" />}>
                  Go to Chat →
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Login
                </Button>
                <Button size="sm" render={<Link href="/register" />}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <Features />
        <Pricing />
        <CTA />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            KIOS Chat — AI-Powered Chat Platform
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
