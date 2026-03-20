"use client"

import { ThreadSidebar } from "@/components/chat/ThreadSidebar"
import { BuyThreadsModal } from "@/components/dashboard/BuyThreadsModal"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

const SIDEBAR_COLLAPSED_KEY = "kios-sidebar-collapsed"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [buyThreadsOpen, setBuyThreadsOpen] = useState(false)

  const openBuyThreads = useCallback(() => {
    setBuyThreadsOpen(true)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== null) {
      setCollapsed(stored === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex shrink-0 border-r border-border transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-[260px]"
        }`}
      >
        <ThreadSidebar
          collapsed={collapsed}
          onCollapseToggle={toggleCollapsed}
          onOpenBuyThreads={openBuyThreads}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="md:hidden fixed top-0 left-0 z-40 p-2">
          <SheetTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9" />}>
              <Menu className="h-5 w-5" />
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-[260px] p-0">
          <ThreadSidebar
            collapsed={false}
            onCollapseToggle={() => {}}
            onOpenBuyThreads={openBuyThreads}
          />
        </SheetContent>
      </Sheet>

      <BuyThreadsModal open={buyThreadsOpen} onOpenChange={setBuyThreadsOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
