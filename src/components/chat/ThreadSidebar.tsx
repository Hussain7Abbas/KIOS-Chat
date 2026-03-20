"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useThreads, useCreateThread, useDeleteThread } from "@/hooks/useThreads"
import { useSession, signOut } from "@/lib/auth-client"
import { ThreadItem } from "./ThreadItem"
import { BuyThreadsModal } from "@/components/dashboard/BuyThreadsModal"
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
} from "lucide-react"
import Link from "next/link"

export function ThreadSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: threads, isLoading } = useThreads()
  const createThread = useCreateThread()
  const deleteThread = useDeleteThread()
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)

  const isAdmin = (session?.user as any)?.role === "admin"
  const threadsRemaining = (session?.user as { threadsRemaining?: number })?.threadsRemaining ?? 0

  const handleNewThread = async () => {
    if (threadsRemaining <= 0) {
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
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-sm">KIOS Chat</h2>
          </div>
          <Badge
            variant={threadsRemaining <= 1 ? "destructive" : "secondary"}
            className="text-xs"
          >
            {threadsRemaining} left
          </Badge>
        </div>

        {/* New Thread Button */}
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleNewThread}
            disabled={createThread.isPending}
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        </div>

        <Separator />

        {/* Thread List */}
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
            ) : threads && threads.length > 0 ? (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={pathname === `/chat/${thread.id}`}
                  onDelete={() => handleDeleteThread(thread.id)}
                />
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No threads yet. Start a conversation!
              </p>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* User Footer */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-left text-sm">
                  {session?.user?.name}
                </span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {isAdmin && (
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </>
                </DropdownMenuItem>
              )}
              {isAdmin && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quota Dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Threads Remaining</DialogTitle>
            <DialogDescription>
              You&apos;ve used all your available threads. Purchase more to
              continue creating conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowQuotaDialog(false)}
            >
              Cancel
            </Button>
            <BuyThreadsModal trigger={<Button>Buy Threads</Button>} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
