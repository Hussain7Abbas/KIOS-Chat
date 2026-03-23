-- AlterTable
ALTER TABLE "SubThread" DROP COLUMN "committedAt";

-- AlterTable
ALTER TABLE "SubThreadMessage" ADD COLUMN "submittedAt" TIMESTAMP(3);
