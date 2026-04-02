import { seedSettingsTable } from "./tables/settings"
import { seedCoinPackageTable } from "./tables/coin-package"
import { seedUsersTable } from "./tables/users"

async function main() {
  console.log("Seeding databases (idempotent — safe to run multiple times)...")

  await seedSettingsTable()
  await seedCoinPackageTable()
  await seedUsersTable()
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
