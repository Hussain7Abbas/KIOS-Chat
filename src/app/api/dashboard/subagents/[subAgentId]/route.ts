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
      include: { params: true, outputParams: true },
    })
    if (!agent) {
      console.warn("[subagent GET] not found", { subAgentId })
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }
    return NextResponse.json(agent)
  } catch (e) {
    console.error("[subagent GET] fetch failed", { subAgentId, err: e })
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
    let body: unknown
    try {
      body = await request.json()
    } catch {
      console.warn("[subagent PATCH] invalid JSON body", { subAgentId })
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parsed = updateSubAgentSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      console.error("[subagent PATCH] validation failed", fieldErrors)
      return NextResponse.json(
        { error: "Invalid input", details: fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.subAgent.findUnique({
      where: { id: subAgentId },
    })
    if (!existing) {
      console.warn("[subagent PATCH] not found", { subAgentId })
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }

    const { params, outputParams, ...rest } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      if (params) {
        await tx.subAgentParam.deleteMany({ where: { subAgentId } })
      }
      if (outputParams) {
        await tx.subAgentOutputParam.deleteMany({ where: { subAgentId } })
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
          ...(outputParams
            ? {
                outputParams: {
                  create: outputParams.map((p) => ({
                    name: p.name,
                    type: p.type,
                    description: p.description,
                  })),
                },
              }
            : {}),
        },
        include: { params: true, outputParams: true },
      })
    })

    console.log("[subagent PATCH] updated", {
      subAgentId,
      name: updated.name,
    })
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("Unique constraint")) {
      console.warn("[subagent PATCH] duplicate name", { subAgentId, message: msg })
      return NextResponse.json(
        { error: "A sub-agent with this name already exists" },
        { status: 409 }
      )
    }
    console.error("[subagent PATCH] update failed", e)
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
      console.warn("[subagent DELETE] not found", { subAgentId })
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }
    console.log("[subagent DELETE] deleted", { subAgentId })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[subagent DELETE] failed", { subAgentId, err: e })
    return NextResponse.json(
      { error: "Failed to delete sub-agent" },
      { status: 500 }
    )
  }
}
