import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AvatarForm } from "@/components/AvatarForm";
import { ProgressChart } from "@/components/ProgressChart";
import { Avatar } from "@/components/race/Avatar";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt } from "@/i18n/dictionaries";
import { getDictionary, getLocale } from "@/i18n/server";
import { avatarUrl } from "@/lib/avatar-url";
import { displayNameOf } from "@/lib/display-name";
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

  const [profile, t, locale, query] = await Promise.all([
    getProfile(session.user.id),
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
  const tiles: [string, string][] = [
    [t.profile.best, show(stats.bestWpm)],
    [t.profile.average, show(stats.averageWpm)],
    [t.profile.accuracy, show(stats.averageAccuracy, " %")],
    [t.profile.races, show(stats.races)],
    [t.profile.wins, show(stats.wins)],
  ];
  const card = "bg-surface flex flex-col gap-4 rounded-3xl p-7";

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-10 pb-16"
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={name} src={photo} className="size-20 text-xl" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
              {name}
            </h1>
            <p className="text-sourdine font-mono text-sm">
              {fmt(t.profile.username, { username: user.username })}
            </p>
          </div>
        </div>

        {ok && (
          <p role="status" className="bg-surface-2 rounded-2xl px-5 py-3 font-semibold">
            {t.profile.ok[ok]}
          </p>
        )}

        <section aria-labelledby="titre-stats" className={card}>
          <h2 id="titre-stats" className="font-display text-3xl font-extrabold">
            {t.profile.statsTitle}
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map(([label, value]) => (
              <div key={label} className="bg-surface-2 flex flex-col gap-1 rounded-2xl p-4">
                <dt className="text-sourdine text-sm">{label}</dt>
                <dd className="font-display text-4xl font-extrabold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sourdine text-sm">{t.profile.statsNote}</p>
          <div className="max-w-3xl">
            <ProgressChart
              points={profile.progression}
              locale={locale}
              t={{
                ...t.profile,
                wpmAxis: t.charts.wpmAxis,
                showData: t.charts.showData,
                time: t.history.date,
              }}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="pseudonyme" aria-labelledby="titre-pseudonyme" className={card}>
            <h2 id="titre-pseudonyme" className="font-display text-3xl font-extrabold">
              {t.profile.nameTitle}
            </h2>
            <form action={updateDisplayName} className="flex flex-col gap-3">
              <label htmlFor="pseudonyme-affiche" className="font-bold">
                {t.profile.nameLabel}
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
                className="border-trait bg-surface-2 min-h-12 rounded-xl border-2 px-4 text-lg"
              />
              <p
                id="aide-pseudonyme"
                role={error === "nom" ? "alert" : undefined}
                className={error === "nom" ? "text-faute font-semibold" : "text-sourdine text-sm"}
              >
                {error === "nom" ? t.profile.errors.nom : t.profile.nameHelp}
              </p>
              <button
                type="submit"
                className="bg-jaune text-nuit min-h-12 self-start rounded-xl px-5 font-bold shadow-[0_4px_0_var(--orange)]"
              >
                {t.profile.nameSubmit}
              </button>
            </form>
          </section>

          <section id="photo" aria-labelledby="titre-photo" className={card}>
            <h2 id="titre-photo" className="font-display text-3xl font-extrabold">
              {t.profile.photoTitle}
            </h2>
            {error && error !== "nom" && (
              <p role="alert" className="text-faute font-semibold">
                {t.profile.errors[error]}
              </p>
            )}
            <AvatarForm hasPhoto={photo !== null} t={t.profile} />
          </section>
        </div>
      </main>
    </>
  );
}
