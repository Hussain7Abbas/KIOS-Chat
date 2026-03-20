import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  const { pathname } = request.nextUrl

  const isProtectedChat = pathname.startsWith("/chat")
  const isProtectedDashboard = pathname.startsWith("/dashboard")
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register")

  // Unauthenticated users: redirect to login
  if ((isProtectedChat || isProtectedDashboard) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Authenticated users on auth pages: redirect to chat
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // Non-admin users trying to access dashboard: redirect to chat
  if (isProtectedDashboard && session?.user.role !== "admin") {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/dashboard/:path*", "/login", "/register"],
}
