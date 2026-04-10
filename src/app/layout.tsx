import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppToaster } from "@/components/AppToaster"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { I18nProvider } from "@/components/providers/I18nProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { defaultLocale } from "@/i18n/config"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
})

export const metadata: Metadata = {
  title: "KIOS Chat — منصة دردشة بالذكاء الاصطناعي",
  description:
    "منصة دردشة حديثة مدعومة بعدة نماذج لغوية. أنشئ المحادثات وخصص وكيلك الذكي والمزيد.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang={defaultLocale}
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <I18nProvider>
            <ThemeProvider>
              <TooltipProvider delay={300}>
                {children}
                <AppToaster />
              </TooltipProvider>
            </ThemeProvider>
          </I18nProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
