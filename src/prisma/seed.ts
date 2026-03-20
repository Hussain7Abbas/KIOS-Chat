import { auth } from "../lib/auth"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("Seeding databases...")

  const adminEmail = "root@email.com"
  const password = "12345678"

  const existingRoot = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingRoot) {
    console.log(`✅ Admin ${adminEmail} already exists.`)
  } else {
    try {
      // Create user via better-auth to ensure proper password hashing
      const response = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: password,
          name: "System Admin",
        },
      })

      if (response?.user) {
        // Upgrade newly created user to Admin
        await prisma.user.update({
          where: { id: response.user.id },
          data: { 
            role: "admin", 
            threadsRemaining: 9999,
          },
        })
        console.log(`✅ Successfully created Admin account: ${adminEmail} | Password: ${password}`)
      }
    } catch (err: any) {
      console.error("❌ Failed to create admin:", err.message || err)
    }
  }

  const demoEmail = "user@email.com"
  const demoExists = await prisma.user.findUnique({
    where: { email: demoEmail },
  })

  if (demoExists) {
    console.log(`✅ Demo user ${demoEmail} already exists.`)
  } else {
    try {
      await auth.api.signUpEmail({
        body: {
          email: demoEmail,
          password: password,
          name: "Standard User",
        },
      })
      console.log(`✅ Successfully created Demo account: ${demoEmail} | Password: ${password}`)
    } catch (err: any) {
      console.error("❌ Failed to create demo user:", err.message || err)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
