-- AlterTable
ALTER TABLE "InviteLink" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "usedById" TEXT,
ADD COLUMN     "usedByName" TEXT,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "InviteLink_roomId_usedById_idx" ON "InviteLink"("roomId", "usedById");
