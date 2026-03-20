"use client"

import { use } from "react"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>
}) {
  const { threadId } = use(params)

  return <ChatWindow threadId={threadId} />
}
