import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { updateSubAgentSchema } from "@/lib/validators"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ subAgentId: string }> }
) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const { subAgentId } = await ctx.params

  try {
    const agent = await prisma.subAgent.findUnique({
      where: { id: subAgentId },
      include: { params: true },
    })
    if (!agent) {
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }
    return NextResponse.json(agent)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sub-agent" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ subAgentId: string }> }
) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const { subAgentId } = await ctx.params

  try {
    const body = await request.json()
    const parsed = updateSubAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.subAgent.findUnique({
      where: { id: subAgentId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }

    const { params, ...rest } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      if (params) {
        await tx.subAgentParam.deleteMany({ where: { subAgentId } })
      }

      return tx.subAgent.update({
        where: { id: subAgentId },
        data: {
          ...rest,
          ...(params
            ? {
                params: {
                  create: params.map((p) => ({
                    name: p.name,
                    type: p.type,
                    description: p.description,
                    required: p.required,
                  })),
                },
              }
            : {}),
        },
        include: { params: true },
      })
    })

    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A sub-agent with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update sub-agent" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ subAgentId: string }> }
) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  const { subAgentId } = await ctx.params

  try {
    const deleted = await prisma.subAgent.deleteMany({
      where: { id: subAgentId },
    })
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete sub-agent" },
      { status: 500 }
    )
  }
}
