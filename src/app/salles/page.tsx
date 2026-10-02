import type { Metadata } from "next";
import { Brand } from "@/components/Brand";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Salles publiques · FastClap" };

const difficultyLabel = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  PRO: "Pro",
} as const;

// Composant serveur asynchrone : il lit la base directement avec Prisma,
// sans API intermédiaire. Aucun code Prisma n'est envoyé au navigateur.
export default async function PublicRoomsPage() {
  await connection(); // rendu à chaque requête : la liste change en permanence

  const [rooms, textCount] = await Promise.all([
    prisma.room.findMany({
      where: { visibility: "PUBLIC", status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        code: true,
        difficulty: true,
        maxPlayers: true,
        organizer: { select: { username: true } },
      },
    }),
    prisma.text.count(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Brand />
      <h1 className="font-display text-4xl font-bold">Salles publiques</h1>
      <p className="text-muted">{textCount} textes disponibles pour les courses.</p>

      {rooms.length === 0 ? (
        <p className="bg-surface text-muted rounded-2xl p-6">
          Aucune salle publique ouverte pour le moment. Reviens dans un instant ou crée la tienne.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((room) => (
            <li
              key={room.code}
              className="bg-surface flex items-center justify-between gap-4 rounded-2xl p-4"
            >
              <span className="text-info font-mono">{room.code}</span>
              <span className="text-muted">{room.organizer.username}</span>
              <span className="text-sm">{difficultyLabel[room.difficulty]}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
