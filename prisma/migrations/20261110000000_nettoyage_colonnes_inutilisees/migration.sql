-- Nettoyage : tables et colonnes jamais utilisées par le code (badges,
-- statistiques par touche, réglages du checkpoint 1, thème et langue du compte).

-- DropForeignKey
ALTER TABLE "KeyStat" DROP CONSTRAINT "KeyStat_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_userId_fkey";

-- AlterTable
ALTER TABLE "InviteLink" DROP COLUMN "expiresAt";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "countdownSec",
DROP COLUMN "length",
DROP COLUMN "lobbyWaitSec";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "locale",
DROP COLUMN "theme";

-- DropTable
DROP TABLE "Badge";

-- DropTable
DROP TABLE "KeyStat";

-- DropTable
DROP TABLE "UserBadge";

-- DropEnum
DROP TYPE "TextLength";

-- DropEnum
DROP TYPE "Theme";

