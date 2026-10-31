-- CreateTable
CREATE TABLE "RoomPresence" (
    "personId" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPresence_pkey" PRIMARY KEY ("personId")
);

-- CreateIndex
CREATE INDEX "RoomPresence_roomCode_idx" ON "RoomPresence"("roomCode");

-- AddForeignKey
ALTER TABLE "RoomPresence" ADD CONSTRAINT "RoomPresence_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "Room"("code") ON DELETE CASCADE ON UPDATE CASCADE;
