import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SEED_USERS } from "@/lib/seed-credentials"

const ADMIN_EMAIL = SEED_USERS.root.email
const DEMO_EMAIL = SEED_USERS.user.email
const DEFAULT_PASSWORD = SEED_USERS.root.password

/**
 * Idempotent: creates admin/demo users only when missing (email is unique).
 * Does not reset passwords or balances for existing accounts.
 */
export async function seedUsersTable(): Promise<void> {
  const existingRoot = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existingRoot) {
    console.log(`✅ Admin ${ADMIN_EMAIL} already exists.`)
  } else {
    try {
      const response = await auth.api.signUpEmail({
        body: {
          email: ADMIN_EMAIL,
          password: DEFAULT_PASSWORD,
          name: "System Admin",
        },
      })

      if (response?.user) {
        await prisma.user.update({
          where: { id: response.user.id },
          data: {
            role: "admin",
            coinsBalance: 9999,
          },
        })
        console.log(
          `✅ Successfully created Admin account: ${ADMIN_EMAIL} | Password: ${DEFAULT_PASSWORD}`,
        )
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("❌ Failed to create admin:", message)
    }
  }

  const demoExists = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  })

  if (demoExists) {
    console.log(`✅ Demo user ${DEMO_EMAIL} already exists.`)
  } else {
    try {
      await auth.api.signUpEmail({
        body: {
          email: DEMO_EMAIL,
          password: DEFAULT_PASSWORD,
          name: "Standard User",
        },
      })
      console.log(
        `✅ Successfully created Demo account: ${DEMO_EMAIL} | Password: ${DEFAULT_PASSWORD}`,
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("❌ Failed to create demo user:", message)
    }
  }
}
