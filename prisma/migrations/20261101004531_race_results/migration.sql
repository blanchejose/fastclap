-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('FINISHED', 'TIME_UP', 'ABANDONED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BotLevel" ADD VALUE 'NOOB';
ALTER TYPE "BotLevel" ADD VALUE 'EXPERT';

-- DropForeignKey
ALTER TABLE "Race" DROP CONSTRAINT "Race_textId_fkey";

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Race" ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "language" "Locale" NOT NULL DEFAULT 'FR',
ALTER COLUMN "textId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RaceResult" ADD COLUMN     "bonuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "errors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRecord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "missed" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rawWpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "samples" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "status" "ResultStatus" NOT NULL DEFAULT 'FINISHED';

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_textId_fkey" FOREIGN KEY ("textId") REFERENCES "Text"("id") ON DELETE SET NULL ON UPDATE CASCADE;
