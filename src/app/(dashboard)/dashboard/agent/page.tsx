import { requireAdmin } from "@/lib/guards"
import { AgentPromptEditor } from "@/components/dashboard/AgentPromptEditor"
import { SubAgentManager } from "@/components/dashboard/SubAgentManager"
import { AgentPageSubheading } from "@/components/dashboard/AgentPageSubheading"
import { prisma } from "@/lib/prisma"
import { DashboardSectionHeading } from "@/components/dashboard/DashboardSectionHeading"

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
      <DashboardSectionHeading
        titleKey="dashboard.agent-page-title"
        descriptionKey="dashboard.agent-page-desc"
      />

      <div className="space-y-2">
        <AgentPageSubheading />
        <AgentPromptEditor
          initialPrompt={user?.agentPrompt ?? null}
          initialPreferredModel={user?.preferredModel ?? defaultModel}
        />
      </div>

      <SubAgentManager />
    </div>
  )
}
