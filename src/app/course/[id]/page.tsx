import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Results } from "@/components/race/Results";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { getRaceForUser } from "@/lib/history";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).history.metaTitle };
}

// HIST-02 : la page de résultats complète d'une course de l'historique,
// relue en base. Seuls ceux qui l'ont courue peuvent l'ouvrir.
export default async function RacePage({ params }: PageProps<"/course/[id]">) {
  const session = await auth();
  const { id } = await params;
  if (!session) redirect(`/connexion?suite=/course/${encodeURIComponent(id)}`);

  const [race, t, locale] = await Promise.all([
    id.length <= 40 ? getRaceForUser(id, session.user.id) : null,
    getDictionary(),
    getLocale(),
  ]);
  if (!race) notFound();

  const tag = locale === "fr" ? "fr-CA" : "en-CA";
  const date = new Intl.DateTimeFormat(tag, { dateStyle: "long", timeStyle: "short" });
  const code = `${race.roomCode.slice(0, 3)}-${race.roomCode.slice(3)}`;

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
            {fmt(t.history.raceTitle, { date: race.endedAt ? date.format(race.endedAt) : "—" })}
          </h1>
          <p className="text-sourdine font-mono">{fmt(t.history.room, { code })}</p>
        </div>

        <Results
          racers={race.racers}
          meId={race.meId}
          records={race.records}
          locale={locale}
          t={{
            ...t.results,
            statuses: t.race.status,
            you: t.room.you,
            bot: t.room.bot,
            bonusNames: t.bonus.names,
            charts: t.charts,
          }}
        />

        <details className="bg-surface rounded-3xl p-6">
          <summary className="cursor-pointer font-bold">{t.history.text}</summary>
          <p className="mt-3 font-mono leading-relaxed">{race.content}</p>
        </details>

        <Link href="/historique" className="self-start font-bold underline underline-offset-4">
          {t.history.back}
        </Link>
      </main>
    </>
  );
}
