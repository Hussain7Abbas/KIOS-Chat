import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import { createSubAgentSchema } from "@/lib/validators"

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  try {
    const agents = await prisma.subAgent.findMany({
      orderBy: { name: "asc" },
      include: { params: true, outputParams: true },
    })
    return NextResponse.json({ subAgents: agents })
  } catch (e) {
    console.error("[subagents GET] list failed", e)
    return NextResponse.json(
      { error: "Failed to list sub-agents" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request)
  if (error) return error

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      console.warn("[subagent POST] invalid JSON body")
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parsed = createSubAgentSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      console.error("[subagent POST] validation failed", fieldErrors)
      return NextResponse.json(
        { error: "Invalid input", details: fieldErrors },
        { status: 400 }
      )
    }

    const { name, instructions, model, outputFormat, params, outputParams } =
      parsed.data

    const created = await prisma.subAgent.create({
      data: {
        name,
        instructions,
        model,
        outputFormat,
        params: {
          create: params.map((p) => ({
            name: p.name,
            type: p.type,
            description: p.description,
            required: p.required,
          })),
        },
        outputParams: {
          create: outputParams.map((p) => ({
            name: p.name,
            type: p.type,
            description: p.description,
          })),
        },
      },
      include: { params: true, outputParams: true },
    })

    console.log("[subagent POST] created", {
      id: created.id,
      name: created.name,
      paramCount: created.params.length,
      outputParamCount: created.outputParams.length,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("Unique constraint")) {
      console.warn("[subagent POST] duplicate name", {
        message: msg,
      })
      return NextResponse.json(
        { error: "A sub-agent with this name already exists" },
        { status: 409 }
      )
    }
    console.error("[subagent POST] create failed", e)
    return NextResponse.json(
      { error: "Failed to create sub-agent" },
      { status: 500 }
    )
  }
}
