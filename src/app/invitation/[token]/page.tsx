import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { GuestForm } from "@/components/GuestForm";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { IP_HEADER } from "@/lib/client-ip";
import { getGuest } from "@/lib/guest";
import { INVITE_TOKEN_PATTERN } from "@/lib/invite-rules";
import { claimInvite } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).invite.title };
}

// SALLE-04 : ouvrir un lien d'invitation. Sans compte ni session d'invité, on
// choisit d'abord un pseudo ; ensuite, le lien est lié à la personne et à son
// adresse IP, puis on entre dans la salle.
export default async function InvitationPage({
  params,
  searchParams,
}: PageProps<"/invitation/[token]">) {
  const { token } = await params;
  if (!INVITE_TOKEN_PATTERN.test(token)) notFound();

  const [link, session, guest, t, requestHeaders, query] = await Promise.all([
    prisma.inviteLink.findUnique({
      where: { token },
      select: { room: { select: { code: true, organizer: { select: { username: true } } } } },
    }),
    auth(),
    getGuest(),
    getDictionary(),
    headers(),
    searchParams,
  ]);
  if (!link) notFound();

  const identity = session ? { uid: session.user.id, name: session.user.username } : guest;
  let error: string | null = null;
  if (identity) {
    const result = await claimInvite(token, identity, requestHeaders.get(IP_HEADER) ?? "inconnue");
    if (result.ok) redirect(`/salle/${result.code}`);
    error = t.invite.errors[result.reason];
  }

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
          {t.invite.title}
        </h1>
        <p className="text-lg">{fmt(t.invite.to, { name: link.room.organizer.username })}</p>
        {error ? (
          <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
            {error}
          </p>
        ) : (
          <GuestForm
            code={link.room.code}
            error={query.invite === "pseudo"}
            t={t.guest}
            login={t.common.login}
            next={`/invitation/${token}`}
          />
        )}
      </main>
    </>
  );
}
