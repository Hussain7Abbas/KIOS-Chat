-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('IDLE', 'PROCESSING', 'WAITING');

-- CreateEnum
CREATE TYPE "SubThreadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "status" "ThreadStatus" NOT NULL DEFAULT 'IDLE';

-- CreateTable
CREATE TABLE "SubAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAgentParam" (
    "id" TEXT NOT NULL,
    "subAgentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubAgentParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubThread" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subAgentId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" TEXT,
    "status" "SubThreadStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubAgent_name_key" ON "SubAgent"("name");

-- CreateIndex
CREATE INDEX "SubAgentParam_subAgentId_idx" ON "SubAgentParam"("subAgentId");

-- CreateIndex
CREATE INDEX "SubThread_threadId_idx" ON "SubThread"("threadId");

-- CreateIndex
CREATE INDEX "SubThread_subAgentId_idx" ON "SubThread"("subAgentId");

-- AddForeignKey
ALTER TABLE "SubAgentParam" ADD CONSTRAINT "SubAgentParam_subAgentId_fkey" FOREIGN KEY ("subAgentId") REFERENCES "SubAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubThread" ADD CONSTRAINT "SubThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubThread" ADD CONSTRAINT "SubThread_subAgentId_fkey" FOREIGN KEY ("subAgentId") REFERENCES "SubAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
