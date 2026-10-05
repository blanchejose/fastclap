import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/room-code";

export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "PRO"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// Crée une salle avec un code unique ; `organizerId` en est l'organisateur.
// Fonction serveur ordinaire (pas une Server Action) : seul le code du serveur l'appelle.
export async function createRoomFor(
  organizerId: string,
  visibility: "PUBLIC" | "SEMI_PUBLIC",
  difficulty: Difficulty,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      await prisma.room.create({ data: { code, organizerId, visibility, difficulty } });
      return code;
    } catch (error) {
      // P2002 : le code existe déjà (très rare), on en tire un autre.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"))
        throw error;
    }
  }
  throw new Error("Impossible de générer un code de salle unique.");
}
