-- AlterTable
ALTER TABLE "SubThread" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "contextLength" INTEGER,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "contextLength" INTEGER,
ADD COLUMN     "lastCompletionTokens" INTEGER,
ADD COLUMN     "lastPromptTokens" INTEGER,
ADD COLUMN     "lastTotalTokens" INTEGER;

-- CreateTable
CREATE TABLE "SubAgentOutputParam" (
    "id" TEXT NOT NULL,
    "subAgentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "SubAgentOutputParam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubAgentOutputParam_subAgentId_idx" ON "SubAgentOutputParam"("subAgentId");

-- AddForeignKey
ALTER TABLE "SubAgentOutputParam" ADD CONSTRAINT "SubAgentOutputParam_subAgentId_fkey" FOREIGN KEY ("subAgentId") REFERENCES "SubAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
