import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/lib/guards"
import { createCheckoutSession } from "@/lib/stripe"
import { purchaseCoinsSchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuthApi(request)
  if (error) return error

  try {
    const body = await request.json()
    const parsed = purchaseCoinsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid package selection" },
        { status: 400 }
      )
    }

    const checkoutUrl = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      coinPackageId: parsed.data.coinPackageId,
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
