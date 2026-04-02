/** Default password for seeded email/password users (see prisma seed). */
export const SEED_DEFAULT_PASSWORD = "12345678"

/** Seeded accounts from `src/prisma/seed/tables/users.ts`. */
export const SEED_USERS = {
  root: {
    email: "root@email.com",
    password: SEED_DEFAULT_PASSWORD,
  },
  user: {
    email: "user@email.com",
    password: SEED_DEFAULT_PASSWORD,
  },
} as const
