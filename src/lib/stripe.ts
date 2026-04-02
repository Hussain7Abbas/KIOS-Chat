import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  coinPackageId: string
  returnUrl: string
}): Promise<string> {
  const pkg = await prisma.coinPackage.findFirst({
    where: { id: params.coinPackageId, isActive: true },
  })

  if (!pkg) {
    throw new Error("Invalid package selected")
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.userEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pkg.coins} Coins`,
            description: `Add ${pkg.coins} coins to your account`,
          },
          unit_amount: pkg.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: params.userId,
      coinsAmount: pkg.coins.toString(),
    },
    success_url: `${params.returnUrl}?success=true`,
    cancel_url: `${params.returnUrl}?canceled=true`,
  })

  return session.url!
}
