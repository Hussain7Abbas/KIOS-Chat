"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useRouter, usePathname } from "next/navigation"
import { useThreads, useCreateThread, useDeleteThread } from "@/hooks/useThreads"
import { useSession, signOut } from "@/lib/auth-client"
import { ThreadItem } from "./ThreadItem"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  ChevronUp,
  ShoppingCart,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import Link from "next/link"

interface ThreadSidebarProps {
  collapsed?: boolean
  onCollapseToggle?: () => void
  onOpenBuyCoins: () => void
}

export function ThreadSidebar({
  collapsed = false,
  onCollapseToggle,
  onOpenBuyCoins,
}: ThreadSidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: threadsData, isLoading } = useThreads()
  const createThread = useCreateThread()
  const deleteThread = useDeleteThread()
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)

  const threads = threadsData?.threads ?? []
  const coinsBalance =
    threadsData?.coinsBalance ??
    (session?.user as { coinsBalance?: number })?.coinsBalance ??
    0
  const threadPrice = threadsData?.threadPrice ?? 1
  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  const lowOnCoins =
    threadPrice > 0 &&
    coinsBalance > 0 &&
    coinsBalance < threadPrice

  const handleNewThread = async () => {
    if (threadPrice > 0 && coinsBalance < threadPrice) {
      setShowQuotaDialog(true)
      return
    }

    try {
      const newThread = await createThread.mutateAsync()
      router.push(`/chat/${newThread.id}`)
    } catch {
      // handled by mutation
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread.mutateAsync(threadId)
      if (pathname === `/chat/${threadId}`) {
        router.push("/chat")
      }
    } catch {
      // handled by mutation
    }
  }

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  return (
    <>
      <div className="flex h-full w-full flex-col bg-card/50">
        <div className={`flex items-center ${collapsed ? "justify-center p-2" : "justify-between p-4"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 w-full">
              {onCollapseToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onCollapseToggle}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <MessageSquare className="h-5 w-5 text-primary shrink-0" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-sm">{t("chat.sidebar-title")}</h2>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={lowOnCoins || coinsBalance <= 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {coinsBalance} {t("common.coins")}
                </Badge>
                {onCollapseToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onCollapseToggle}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <div className={collapsed ? "flex justify-center px-2 pb-2" : "px-3 pb-3"}>
          <Button
            variant="outline"
            className={collapsed ? "h-9 w-9 p-0" : "w-full justify-start gap-2"}
            onClick={handleNewThread}
            disabled={createThread.isPending}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && t("chat.new-thread")}
          </Button>
        </div>

        <Separator />

        {collapsed && <div className="flex-1 min-h-0" />}

        {!collapsed && (
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 py-2">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 rounded-md bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : threads.length > 0 ? (
                threads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={pathname === `/chat/${thread.id}`}
                    onDelete={() => handleDeleteThread(thread.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-4 px-3 py-6">
                  <p className="text-center text-sm text-muted-foreground">
                    {t("chat.no-threads")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <div className={collapsed ? "p-2 flex justify-center" : "p-3"}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className={collapsed ? "h-9 w-9 p-0" : "w-full justify-start gap-2 px-2"}
                >
                  <Avatar className={collapsed ? "h-8 w-8" : "h-7 w-7"}>
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-start text-sm">
                        {session?.user?.name}
                      </span>
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              {isAdmin && (
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <>
                    <LayoutDashboard className="me-2 h-4 w-4" />
                    {t("chat.dashboard")}
                  </>
                </DropdownMenuItem>
              )}
              {isAdmin && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => onOpenBuyCoins()}
              >
                <ShoppingCart className="me-2 h-4 w-4" />
                {t("chat.buy-coins")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="me-2 h-4 w-4" />
                {t("chat.sign-out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("chat.not-enough-coins")}</DialogTitle>
            <DialogDescription>
              {threadPrice === 1
                ? t("chat.quota-one", { count: threadPrice })
                : t("chat.quota-many", { count: threadPrice })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowQuotaDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowQuotaDialog(false)
                onOpenBuyCoins()
              }}
            >
              {t("chat.buy-coins")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
