import { requireAdmin } from "@/lib/guards"
import { AgentPromptEditor } from "@/components/dashboard/AgentPromptEditor"
import { SubAgentManager } from "@/components/dashboard/SubAgentManager"
import { prisma } from "@/lib/prisma"

const defaultModel =
  process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini"

export default async function DashboardAgentPage() {
  const session = await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agentPrompt: true, preferredModel: true },
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Agent configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Main agent instructions and global sub-agents available in every
          thread.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Main agent instructions
        </h3>
        <AgentPromptEditor
          initialPrompt={user?.agentPrompt ?? null}
          initialPreferredModel={user?.preferredModel ?? defaultModel}
        />
      </div>

      <SubAgentManager />
    </div>
  )
}
