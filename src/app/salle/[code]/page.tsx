import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { GuestForm } from "@/components/GuestForm";
import { RoomLive } from "@/components/RoomLive";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { IP_HEADER } from "@/lib/client-ip";
import { avatarUrl } from "@/lib/avatar-url";
import { displayNameOf } from "@/lib/display-name";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { codeAttempts } from "@/lib/rate-limit";
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
  const ip = (await headers()).get(IP_HEADER) ?? "inconnue";
  // SALLE-10 : après 10 essais ratés en une minute, plus aucun code ne
  // s'ouvre depuis cette adresse, pour ne rien révéler sur les codes valides.
  if (codeAttempts.isBlocked(ip)) return <TooMany message={(await getDictionary()).code.trop} />;
  const code = normalizeRoomCode(raw);
  if (!code) {
    codeAttempts.record(ip);
    notFound();
  }

  const [room, session, guest, t, locale] = await Promise.all([
    prisma.room.findUnique({
      where: { code },
      select: {
        code: true,
        status: true,
        visibility: true,
        organizer: { select: { username: true, name: true } },
      },
    }),
    auth(),
    getGuest(),
    getDictionary(),
    getLocale(),
  ]);
  if (!room || room.status === "CLOSED") {
    codeAttempts.record(ip);
    notFound();
  }

  // Un compte connecté, avec son pseudonyme et sa photo (AUTH-04, AUTH-05),
  // sinon un invité avec son cookie (AUTH-02).
  const account = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, name: true, avatarUpdatedAt: true },
      })
    : null;
  const identity =
    session && account
      ? {
          uid: session.user.id,
          name: displayNameOf(account),
          avatar: avatarUrl(session.user.id, account.avatarUpdatedAt),
        }
      : guest;

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-[78rem] flex-1 flex-col gap-6 overflow-x-clip px-4 pt-10 pb-16 sm:px-6"
      >
        <div className="motion-safe:animate-monte flex flex-col items-start gap-3">
          <Link
            href="/salles"
            className="text-sourdine hover:text-encre group inline-flex items-center gap-2 font-bold transition"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 transition group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            {t.room.back}
          </Link>
          <h1 className="font-display text-[clamp(34px,4.6vw,56px)] leading-[0.95] font-extrabold tracking-tight">
            {fmt(t.roomList.roomOf, { name: room.organizer.name ?? room.organizer.username })}
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
              invite: t.invite,
              bonus: t.bonus,
              charts: t.charts,
              history: t.history,
            }}
          />
        ) : room.visibility === "PRIVATE" ? (
          // SALLE-04 : sans lien d'invitation, pas de formulaire d'invité.
          <p className="carte p-6 text-lg font-semibold">{t.invite.privateRoom}</p>
        ) : (
          <GuestForm code={room.code} error={guestError} t={t.guest} login={t.common.login} />
        )}
      </main>
    </>
  );
}

function TooMany({ message }: { message: string }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-10 pb-16">
        <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
          {message}
        </p>
      </main>
    </>
  );
}
