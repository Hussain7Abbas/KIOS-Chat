"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  useSubAgents,
  useDeleteSubAgent,
  type SubAgentDto,
} from "@/hooks/useSubAgents"
import { SubAgentCard } from "./SubAgentCard"
import { SubAgentForm } from "./SubAgentForm"

export function SubAgentManager() {
  const { data: agents, isLoading } = useSubAgents()
  const deleteMut = useDeleteSubAgent()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SubAgentDto | null>(null)
  const [formMountKey, setFormMountKey] = useState(0)

  const openCreate = () => {
    setEditing(null)
    setFormMountKey((k) => k + 1)
    setFormOpen(true)
  }

  const openEdit = (agent: SubAgentDto) => {
    setEditing(agent)
    setFormMountKey((k) => k + 1)
    setFormOpen(true)
  }

  const handleDelete = async (agent: SubAgentDto) => {
    if (!confirm(`Delete sub-agent "${agent.name}"? This cannot be undone.`)) {
      return
    }
    try {
      await deleteMut.mutateAsync(agent.id)
      toast.success("Sub-agent deleted")
    } catch {
      toast.error("Failed to delete sub-agent")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Sub-agents</CardTitle>
            <CardDescription>
              Configure tools the main agent can call. Each sub-agent runs in
              its own queued job with an isolated context (input only, no main
              thread history).
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add sub-agent
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : !agents || agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No sub-agents yet. Add one to expose function tools to the main
              agent.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {agents.map((agent) => (
                <SubAgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteMut.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SubAgentForm
        key={formMountKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
    </>
  )
}
