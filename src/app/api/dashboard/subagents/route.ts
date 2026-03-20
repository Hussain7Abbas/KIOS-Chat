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
      include: { params: true },
    })
    return NextResponse.json({ subAgents: agents })
  } catch {
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
    const body = await request.json()
    const parsed = createSubAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, instructions, model, outputFormat, params } = parsed.data

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
      },
      include: { params: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A sub-agent with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create sub-agent" },
      { status: 500 }
    )
  }
}
