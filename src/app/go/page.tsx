import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { createQuickRoom } from "@/app/salle/actions";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";
import { listRooms, pickQuickRoom } from "@/lib/explorer";
import { liveRooms } from "@/lib/race/registry";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).quick.metaTitle };
}

// JOIN-03 : « Faire une course ». La salle publique joignable la plus proche
// de sa capacité, sinon un message : avec un compte, on propose d'en créer une.
export default async function QuickPlayPage() {
  await connection(); // dépend des salles en mémoire à cet instant
  const room = pickQuickRoom(listRooms(liveRooms.values()));
  if (room) redirect(`/salle/${room.code}`);

  const [session, t] = await Promise.all([auth(), getDictionary()]);
  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <h1 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl">
          {t.quick.title}
        </h1>
        <div className="border-trait flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed p-7">
          <p role="status" className="text-lg font-semibold">
            {t.quick.none}
          </p>
          {session ? (
            <form action={createQuickRoom} className="flex flex-col items-start gap-3">
              <p className="text-sourdine">{t.quick.offer}</p>
              <button
                type="submit"
                className="bg-jaune font-display text-nuit min-h-14 rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
              >
                {t.quick.create}
              </button>
            </form>
          ) : (
            <>
              <p className="text-sourdine">{t.quick.guest}</p>
              {/* JOIN-03 : un invité ne crée pas de salle, mais il peut entrer un code. */}
              <RoomCodeForm t={t.code} />
              <Link
                href="/connexion?suite=/go"
                className="bg-bleu inline-flex min-h-12 items-center rounded-xl px-5 font-bold text-white transition hover:-translate-y-0.5"
              >
                {t.rooms.loginToCreate}
              </Link>
            </>
          )}
          <Link href="/salles" className="font-bold underline underline-offset-4">
            {t.quick.allRooms}
          </Link>
        </div>
      </main>
    </>
  );
}
