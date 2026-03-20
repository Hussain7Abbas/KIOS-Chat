import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export interface ThreadPackage {
  threads: number
  price: number
  label: string
}

export const THREAD_PACKAGES: ThreadPackage[] = [
  { threads: 10, price: 499, label: "Starter" },
  { threads: 50, price: 1999, label: "Pro" },
  { threads: 100, price: 3499, label: "Enterprise" },
]

export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  packageIndex: number
  returnUrl: string
}): Promise<string> {
  const pkg = THREAD_PACKAGES[params.packageIndex]

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
            name: `${pkg.threads} Chat Threads`,
            description: `Add ${pkg.threads} chat threads to your account`,
          },
          unit_amount: pkg.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: params.userId,
      threadsAmount: pkg.threads.toString(),
    },
    success_url: `${params.returnUrl}?success=true`,
    cancel_url: `${params.returnUrl}?canceled=true`,
  })

  return session.url!
}
