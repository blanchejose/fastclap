import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { AvatarForm } from "@/components/AvatarForm";
import { Bib } from "@/components/Bib";
import { ProgressChart } from "@/components/ProgressChart";
import { Avatar } from "@/components/race/Avatar";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { avatarUrl } from "@/lib/avatar-url";
import { displayNameOf } from "@/lib/display-name";
import { listHistory } from "@/lib/history";
import { getProfile } from "@/lib/profile";
import { updateDisplayName } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).profile.metaTitle };
}

type Messages = "nom" | "photo" | "photo-retiree";
type Errors = "nom" | "vide" | "taille" | "type";
const pick = <T extends string>(value: unknown, keys: readonly T[]) =>
  keys.find((k) => k === value);

// AUTH-06 : statistiques personnelles et progression ; AUTH-05 : pseudonyme ;
// AUTH-04 : photo de profil.
export default async function ProfilePage({ searchParams }: PageProps<"/profil">) {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/profil");

  const [profile, recent, t, locale, query] = await Promise.all([
    getProfile(session.user.id),
    listHistory(session.user.id, 1),
    getDictionary(),
    getLocale(),
    searchParams,
  ]);
  if (!profile) redirect("/connexion?suite=/profil");
  const ok = pick<Messages>(query.ok, ["nom", "photo", "photo-retiree"]);
  const error = pick<Errors>(query.erreur, ["nom", "vide", "taille", "type"]);

  const { user, stats } = profile;
  const name = displayNameOf(user);
  const photo = avatarUrl(session.user.id, user.avatarUpdatedAt);
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    maximumFractionDigits: 1,
  });
  const show = (value: number | null, unit = "") =>
    value === null ? "—" : `${number.format(value)}${unit}`;
  const date = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
  });
  const p = t.profile;
  // Les cinq dossards, dans l'ordre et l'inclinaison de la maquette.
  const bibs = [
    { label: p.best, value: show(stats.bestWpm), unit: p.wpmUnit, swing: "-3deg" },
    { label: p.average, value: show(stats.averageWpm), unit: p.wpmUnit, swing: "2deg" },
    { label: p.accuracy, value: show(stats.averageAccuracy), unit: p.accuracyUnit, swing: "-2deg" },
    { label: p.races, value: show(stats.races), unit: p.racesUnit, swing: "3deg" },
    { label: p.wins, value: show(stats.wins), unit: p.winsUnit, swing: "-1deg" },
  ];
  // « Nom d'utilisateur pour te connecter : {username} », le pseudo en gras.
  const [before, after] = p.username.split("{username}");
  const card = "carte motion-safe:animate-monte flex min-w-0 flex-col p-[26px]";
  const field =
    "bg-surface-2 text-encre focus:border-bleu focus:bg-surface h-[52px] w-full rounded-[14px] border-2 px-4 text-[17px] font-semibold transition-colors outline-none";

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 px-6 pt-14 pb-16"
      >
        <section className="motion-safe:animate-monte flex flex-wrap items-center gap-7">
          <Avatar
            name={name}
            src={photo}
            className="font-display! size-[132px] rounded-[40px]! text-6xl! font-extrabold shadow-[0_8px_0_var(--bleu)]"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="eyebrow">{p.title}</p>
            <h1 className="font-display text-[clamp(44px,6vw,72px)] leading-[0.95] font-extrabold tracking-tight break-words">
              {name}
            </h1>
            <p className="text-sourdine">
              {before}
              <span className="text-encre font-mono font-bold">{user.username}</span>
              {after}
            </p>
          </div>
        </section>

        {ok && (
          <p role="status" className="bg-surface-2 rounded-2xl px-5 py-3 font-semibold">
            {p.ok[ok]}
          </p>
        )}

        {/* AUTH-06 : les statistiques, en dossards qui se balancent. */}
        <section
          aria-labelledby="titre-stats"
          className="bg-bleu motion-safe:animate-monte flex flex-col gap-[26px] rounded-[32px] p-6 text-white [animation-delay:80ms] sm:p-10"
        >
          <h2
            id="titre-stats"
            className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-tight"
          >
            {p.statsTitle}
          </h2>
          <dl className="grid grid-cols-2 gap-[18px] pt-2 sm:grid-cols-3 lg:grid-cols-5">
            {bibs.map((bib, i) => (
              <Bib key={bib.label} {...bib} delay={`${-0.8 * i}s`} inDefinitionList />
            ))}
          </dl>
          <p className="text-sm text-white">{p.statsNote}</p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className={`${card} [animation-delay:160ms]`}>
            <ProgressChart
              points={profile.progression}
              locale={locale}
              t={{
                ...p,
                wpmAxis: t.charts.wpmAxis,
                showData: t.charts.showData,
                time: t.history.date,
              }}
            />
          </div>

          {/* Les dernières courses ; l'historique complet est sur sa page (HIST-01). */}
          <section
            aria-labelledby="titre-courses"
            className={`${card} gap-2 [animation-delay:220ms]`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="titre-courses" className="font-display text-2xl font-extrabold">
                {p.recentTitle}
              </h2>
              <Link
                href="/historique"
                className="text-bleu-texte inline-flex items-center gap-1.5 font-bold"
              >
                {p.historyLink}
                <svg
                  className="fleche"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sourdine">{t.history.empty}</p>
            ) : (
              <div
                role="region"
                aria-labelledby="titre-courses"
                tabIndex={0}
                className="overflow-x-auto rounded-lg"
              >
                <table className="classement min-w-0!">
                  <thead>
                    <tr>
                      <th scope="col">{t.history.date}</th>
                      <th scope="col">{t.history.rank}</th>
                      <th scope="col">{t.results.wpm}</th>
                      <th scope="col">{t.results.accuracy}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 4).map((race) => (
                      <tr key={race.raceId}>
                        <th scope="row">
                          <Link
                            href={`/course/${race.raceId}`}
                            className="text-bleu-texte font-bold whitespace-nowrap"
                          >
                            {race.endedAt ? date.format(race.endedAt) : "—"}
                          </Link>
                        </th>
                        <td className="whitespace-nowrap">
                          {fmt(t.history.rankOf, { rank: race.rank, total: race.total })}
                        </td>
                        <td className="font-mono whitespace-nowrap tabular-nums">
                          {number.format(race.wpm)}
                          {race.isRecord && (
                            <span className="badge badge-hote ml-2">{t.history.record}</span>
                          )}
                        </td>
                        <td className="font-mono whitespace-nowrap tabular-nums">
                          {number.format(race.accuracy)} %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section
            id="pseudonyme"
            aria-labelledby="titre-pseudonyme"
            className={`${card} gap-4 [animation-delay:280ms]`}
          >
            <h2 id="titre-pseudonyme" className="font-display text-[22px] font-extrabold">
              {p.nameTitle}
            </h2>
            <form action={updateDisplayName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="pseudonyme-affiche" className="text-[15px] font-bold">
                  {p.nameLabel}
                </label>
                <input
                  id="pseudonyme-affiche"
                  name="name"
                  required
                  minLength={3}
                  maxLength={20}
                  defaultValue={name}
                  autoComplete="nickname"
                  aria-describedby="aide-pseudonyme"
                  aria-invalid={error === "nom" || undefined}
                  className={`${field} ${error === "nom" ? "border-faute" : "border-trait"}`}
                />
                <p
                  id="aide-pseudonyme"
                  role={error === "nom" ? "alert" : undefined}
                  className={
                    error === "nom" ? "text-faute font-semibold" : "text-sourdine text-[13px]"
                  }
                >
                  {error === "nom" ? p.errors.nom : p.nameHelp}
                </p>
              </div>
              <button type="submit" className="btn btn-bleu self-start">
                {p.nameSubmit}
              </button>
            </form>
          </section>

          <section
            id="photo"
            aria-labelledby="titre-photo"
            className={`${card} gap-4 [animation-delay:340ms]`}
          >
            <h2 id="titre-photo" className="font-display text-[22px] font-extrabold">
              {p.photoTitle}
            </h2>
            {error && error !== "nom" && (
              <p role="alert" className="text-faute font-semibold">
                {p.errors[error]}
              </p>
            )}
            <AvatarForm hasPhoto={photo !== null} t={p} />
          </section>
        </div>
      </main>
    </>
  );
}
