-- AlterTable
ALTER TABLE "SubThread" ADD COLUMN     "anchorMessageId" TEXT;

-- CreateTable
CREATE TABLE "SubThreadMessage" (
    "id" TEXT NOT NULL,
    "subThreadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubThreadMessage_subThreadId_idx" ON "SubThreadMessage"("subThreadId");

-- CreateIndex
CREATE INDEX "SubThread_anchorMessageId_idx" ON "SubThread"("anchorMessageId");

-- AddForeignKey
ALTER TABLE "SubThread" ADD CONSTRAINT "SubThread_anchorMessageId_fkey" FOREIGN KEY ("anchorMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubThreadMessage" ADD CONSTRAINT "SubThreadMessage_subThreadId_fkey" FOREIGN KEY ("subThreadId") REFERENCES "SubThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
