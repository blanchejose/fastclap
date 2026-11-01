import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt, ordinal } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { countHistory, HISTORY_PAGE_SIZE, listHistory, parsePage } from "@/lib/history";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).history.metaTitle };
}

// HIST-01 : les courses terminées de l'utilisateur connecté, avec pagination.
export default async function HistoryPage({ searchParams }: PageProps<"/historique">) {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/historique");
  const userId = session.user.id;

  const [t, locale, query, total] = await Promise.all([
    getDictionary(),
    getLocale(),
    searchParams,
    countHistory(userId),
  ]);
  const page = parsePage(query.page, total);
  const pages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
  const races = await listHistory(userId, page);

  // I18N-03 : dates et nombres selon la langue choisie.
  const tag = locale === "fr" ? "fr-CA" : "en-CA";
  const date = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" });
  const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  const cell = "px-3 py-2.5 text-right font-mono tabular-nums";
  const pageLink =
    "bg-surface inline-flex min-h-11 items-center rounded-xl px-4 font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
          {t.history.title}
        </h1>
        <p className="text-sourdine max-w-[40em] text-lg">{t.history.lead}</p>

        {total === 0 ? (
          <div className="border-trait flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed p-6">
            <p className="text-sourdine">{t.history.empty}</p>
            <Link href="/salles" className="bg-surface-2 rounded-xl px-5 py-3 font-bold">
              {t.history.emptyLink}
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-surface overflow-x-auto rounded-3xl p-4">
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <caption className="sr-only">{t.history.caption}</caption>
                <thead className="text-sourdine border-trait border-b-2 text-sm">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      {t.history.date}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t.history.rank}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      {t.results.wpm}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      {t.results.accuracy}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t.results.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => (
                    <tr key={race.raceId} className="border-trait border-b">
                      <th scope="row" className="px-3 py-2.5 font-semibold">
                        {/* HIST-02 : la date mène aux résultats complets. */}
                        <Link
                          href={`/course/${race.raceId}`}
                          className="underline underline-offset-4"
                        >
                          {race.endedAt ? date.format(race.endedAt) : "—"}
                        </Link>
                        {race.isRecord && (
                          <span className="bg-jaune text-nuit ml-2 rounded px-1.5 font-mono text-xs font-bold">
                            {t.history.record}
                          </span>
                        )}
                      </th>
                      <td className="px-3 py-2.5">
                        {fmt(t.history.rankOf, {
                          rank: ordinal(race.rank, locale),
                          total: race.total,
                        })}
                      </td>
                      <td className={cell}>{number.format(race.wpm)}</td>
                      <td className={cell}>{number.format(race.accuracy)} %</td>
                      <td className="px-3 py-2.5">{t.race.status[race.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav aria-label={t.history.pagination} className="flex flex-wrap items-center gap-4">
              <Link
                href={`/historique?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
                className={pageLink}
              >
                {t.history.previous}
              </Link>
              <span className="font-semibold" aria-current="page">
                {fmt(t.history.page, { n: page, total: pages })}
              </span>
              <Link
                href={`/historique?page=${page + 1}`}
                aria-disabled={page >= pages}
                tabIndex={page >= pages ? -1 : undefined}
                className={pageLink}
              >
                {t.history.next}
              </Link>
            </nav>
          </>
        )}
      </main>
    </>
  );
}
