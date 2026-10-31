import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { GuestForm } from "@/components/GuestForm";
import { RoomLive } from "@/components/RoomLive";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";
import { createSocketToken } from "@/lib/socket-token";

export async function generateMetadata({ params }: PageProps<"/salle/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: code.toUpperCase() };
}

// Composant serveur : lit la salle dans la base, vérifie la session, puis
// donne au composant client un jeton signé pour le serveur temps réel.
export default async function RoomPage({ params, searchParams }: PageProps<"/salle/[code]">) {
  const { code: raw } = await params;
  const guestError = (await searchParams).invite === "pseudo";
  const code = normalizeRoomCode(raw);
  if (!code) notFound();

  const [room, session, guest, t, locale] = await Promise.all([
    prisma.room.findUnique({
      where: { code },
      select: {
        code: true,
        status: true,
        organizer: { select: { username: true } },
      },
    }),
    auth(),
    getGuest(),
    getDictionary(),
    getLocale(),
  ]);
  if (!room || room.status === "CLOSED") notFound();

  // Un compte connecté, sinon un invité avec son cookie (AUTH-02).
  const identity = session ? { uid: session.user.id, name: session.user.username } : guest;

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
        </div>

        {identity ? (
          <RoomLive
            code={room.code}
            meId={identity.uid}
            token={createSocketToken(identity, process.env.AUTH_SECRET ?? "")}
            locale={locale}
            t={{
              room: t.room,
              race: t.race,
              results: t.results,
              config: t.config,
              levels: t.levels,
            }}
          />
        ) : (
          <GuestForm code={room.code} error={guestError} t={t.guest} login={t.common.login} />
        )}

        <Link href="/salles" className="self-start font-bold underline underline-offset-4">
          {t.room.back}
        </Link>
      </main>
    </>
  );
}
