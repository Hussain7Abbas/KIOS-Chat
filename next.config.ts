import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Prisma must not be bundled into Route Handlers; bundling drops model delegates and
  // causes runtime errors like "Cannot read properties of undefined (reading 'create')".
  serverExternalPackages: ["@prisma/client", "prisma"],
}

export default nextConfig
