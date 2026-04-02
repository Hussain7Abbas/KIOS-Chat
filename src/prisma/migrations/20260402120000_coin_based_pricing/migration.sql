-- Rename User columns
ALTER TABLE "User" RENAME COLUMN "threadsRemaining" TO "coinsBalance";
ALTER TABLE "User" RENAME COLUMN "threadsPurchased" TO "coinsPurchased";

-- Reset all users to new coin system defaults
UPDATE "User" SET "coinsBalance" = 3, "coinsPurchased" = 0;

-- Rename Purchase column
ALTER TABLE "Purchase" RENAME COLUMN "threadsAmount" TO "coinsAmount";

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CoinPackage" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinPackage_pkey" PRIMARY KEY ("id")
);
