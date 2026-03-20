"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import type { SubAgentDto } from "@/hooks/useSubAgents"

interface SubAgentCardProps {
  agent: SubAgentDto
  onEdit: (agent: SubAgentDto) => void
  onDelete: (agent: SubAgentDto) => void
  isDeleting?: boolean
}

export function SubAgentCard({
  agent,
  onEdit,
  onDelete,
  isDeleting,
}: SubAgentCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base font-mono">{agent.name}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1">
            {agent.instructions.slice(0, 120)}
            {agent.instructions.length > 120 ? "…" : ""}
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(agent)}
            aria-label={`Edit ${agent.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(agent)}
            disabled={isDeleting}
            aria-label={`Delete ${agent.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-0">
        <Badge variant="secondary">{agent.model}</Badge>
        <Badge variant="outline">{agent.outputFormat}</Badge>
        <Badge variant="outline">{agent.params.length} params</Badge>
      </CardContent>
    </Card>
  )
}
