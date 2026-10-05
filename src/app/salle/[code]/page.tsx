import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";

export const metadata: Metadata = { title: "Salle" };

const visibilityLabel = {
  PUBLIC: "Publique",
  SEMI_PUBLIC: "Avec code",
  PRIVATE: "Privée",
} as const;

// Composant serveur : la salle est lue dans la base à partir du code de l'URL.
export default async function RoomPage({ params }: PageProps<"/salle/[code]">) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);
  if (!code) notFound();

  const room = await prisma.room.findUnique({
    where: { code },
    select: {
      code: true,
      visibility: true,
      status: true,
      maxPlayers: true,
      organizer: { select: { username: true } },
    },
  });
  if (!room || room.status === "CLOSED") notFound();

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 pt-12 pb-16"
      >
        <p className="text-sourdine font-mono text-sm font-semibold tracking-widest">
          SALLE {room.code.slice(0, 3)}-{room.code.slice(3)}
        </p>
        <h1 className="font-display text-6xl leading-[0.9] font-black uppercase">
          Salle de {room.organizer.username}
        </h1>
        <dl className="border-encre bg-surface grid grid-cols-2 gap-4 rounded-xl border-2 p-6">
          <div>
            <dt className="text-sourdine text-sm">Accès</dt>
            <dd className="text-lg font-bold">{visibilityLabel[room.visibility]}</dd>
          </div>
          <div>
            <dt className="text-sourdine text-sm">Joueurs</dt>
            <dd className="text-lg font-bold">Jusqu&apos;à {room.maxPlayers}</dd>
          </div>
        </dl>
        <Link href="/salles" className="font-bold underline underline-offset-4">
          Retour aux salles
        </Link>
      </main>
    </>
  );
}
