"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, Plus } from "lucide-react"
import { useCreateThread } from "@/hooks/useThreads"
import { useRouter } from "next/navigation"

export default function ChatIndexPage() {
  const router = useRouter()
  const createThread = useCreateThread()

  const handleNewThread = async () => {
    try {
      const newThread = await createThread.mutateAsync()
      router.push(`/chat/${newThread.id}`)
    } catch {
      // handled by mutation
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to KIOS Chat</h1>
        <p className="text-muted-foreground mb-8">
          Select a thread from the sidebar or create a new one to start
          chatting with AI.
        </p>
        <Button onClick={handleNewThread} disabled={createThread.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          New Thread
        </Button>
      </div>
    </div>
  )
}
