import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

const levelLabel = { BEGINNER: "Débutant", INTERMEDIATE: "Intermédiaire", PRO: "Pro" } as const;

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Composant serveur asynchrone : lit les salles publiques ouvertes dans la base.
export async function RoomList({ limit }: { limit: number }) {
  await connection(); // la liste change à chaque instant : rendu à chaque requête

  const rooms = await prisma.room.findMany({
    where: { visibility: "PUBLIC", status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      code: true,
      difficulty: true,
      maxPlayers: true,
      organizer: { select: { username: true } },
    },
  });

  if (rooms.length === 0) {
    return (
      <p className="border-trait text-sourdine rounded-3xl border-2 border-dashed p-6">
        Personne sur la piste pour l&apos;instant. Crée une salle et invite ta classe avec son code.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
      {rooms.map((room) => (
        <li key={room.code}>
          <Link
            href={`/salle/${room.code}`}
            className="bg-surface hover:border-bleu flex flex-col gap-3 rounded-3xl border-2 border-transparent p-5 transition hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-between">
              <span className="font-mono text-[15px] font-semibold tracking-wider">
                {formatCode(room.code)}
              </span>
              <span className="bg-surface-2 rounded-full px-2.5 py-1 text-xs font-bold">
                {levelLabel[room.difficulty]}
              </span>
            </span>
            <span className="font-display text-2xl leading-tight font-extrabold">
              Salle de {room.organizer.username}
            </span>
            <span className="text-sourdine text-sm">Jusqu&apos;à {room.maxPlayers} joueurs</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
