import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { createCheckoutSession, THREAD_PACKAGES } from "@/lib/stripe"
import { purchaseThreadsSchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = purchaseThreadsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid package selection" },
        { status: 400 }
      )
    }

    const checkoutUrl = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      packageIndex: parsed.data.packageIndex,
      // redirect back to chat
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
