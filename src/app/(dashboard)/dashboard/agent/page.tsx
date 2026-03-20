import { requireAdmin } from "@/lib/guards"
import { AgentPromptEditor } from "@/components/dashboard/AgentPromptEditor"
import { prisma } from "@/lib/prisma"

export default async function DashboardAgentPage() {
  const session = await requireAdmin()

  // Fetch the current user's agent prompt directly from DB to ensure freshest data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agentPrompt: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Agent Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Customize the system prompt to define your AI assistant's underlying behavior and personality.
        </p>
      </div>

      <AgentPromptEditor initialPrompt={user?.agentPrompt ?? null} />
    </div>
  )
}
