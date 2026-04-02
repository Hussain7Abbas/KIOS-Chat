import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const coinsAmount = parseInt(session.metadata?.coinsAmount ?? "0", 10)

    if (!userId || !Number.isFinite(coinsAmount) || coinsAmount < 1) {
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      )
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.purchase.create({
          data: {
            userId,
            stripeId: session.id,
            coinsAmount,
            amountPaid: session.amount_total ?? 0,
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: {
            coinsBalance: { increment: coinsAmount },
            coinsPurchased: { increment: coinsAmount },
          },
        })
      })
    } catch {
      return NextResponse.json(
        { error: "Failed to process purchase" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
