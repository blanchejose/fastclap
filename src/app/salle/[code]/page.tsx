import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RoomLive } from "@/components/RoomLive";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";
import { createSocketToken } from "@/lib/socket-token";

export async function generateMetadata({ params }: PageProps<"/salle/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: code.toUpperCase() };
}

// Composant serveur : lit la salle dans la base, vérifie la session, puis
// donne au composant client un jeton signé pour le serveur temps réel.
export default async function RoomPage({ params }: PageProps<"/salle/[code]">) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);
  if (!code) notFound();

  const [room, session, t] = await Promise.all([
    prisma.room.findUnique({
      where: { code },
      select: {
        code: true,
        visibility: true,
        status: true,
        difficulty: true,
        organizer: { select: { username: true } },
      },
    }),
    auth(),
    getDictionary(),
  ]);
  if (!room || room.status === "CLOSED") notFound();

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
            {fmt(t.roomList.roomOf, { name: room.organizer.username })}
          </h1>
          <p className="flex gap-2 text-sm font-bold">
            <span className="bg-surface rounded-full px-3 py-1.5">
              {t.visibility[room.visibility]}
            </span>
            <span className="bg-surface rounded-full px-3 py-1.5">{t.levels[room.difficulty]}</span>
          </p>
        </div>

        {session ? (
          <RoomLive
            code={room.code}
            meId={session.user.id}
            token={createSocketToken(
              { uid: session.user.id, name: session.user.username },
              process.env.AUTH_SECRET ?? "",
            )}
            t={t.room}
          />
        ) : (
          <div className="bg-surface flex flex-col items-start gap-4 rounded-3xl p-7">
            <p className="text-lg">{t.room.loginToJoin}</p>
            <Link
              href={`/connexion?suite=/salle/${room.code}`}
              className="bg-jaune font-display text-nuit inline-flex min-h-14 items-center rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
            >
              {t.common.login}
            </Link>
          </div>
        )}

        <Link href="/salles" className="self-start font-bold underline underline-offset-4">
          {t.room.back}
        </Link>
      </main>
    </>
  );
}
