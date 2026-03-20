import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

// ─── Server Components & Server Actions ─────────────────────────────────────

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) redirect("/login")
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== "admin") redirect("/chat")
  return session
}

// ─── API Route Handlers ─────────────────────────────────────────────────────

export async function requireAuthApi(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return {
      session: null as null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { session, error: null as null }
}

export async function requireAdminApi(request: NextRequest) {
  const result = await requireAuthApi(request)

  if (result.error) {
    return { session: null as null, error: result.error }
  }

  if (result.session!.user.role !== "admin") {
    return {
      session: null as null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { session: result.session, error: null as null }
}
