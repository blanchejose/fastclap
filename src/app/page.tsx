import Link from "next/link";
import { Suspense } from "react";
import { RaceDemo } from "@/components/RaceDemo";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { RoomList } from "@/components/RoomList";
import { SiteHeader } from "@/components/SiteHeader";
import { Wordmark } from "@/components/Logo";

const steps = [
  {
    title: "Choisis ton pseudo",
    text: "Ou connecte-toi avec Discord ou GitHub pour garder tes stats.",
  },
  {
    title: "Prends le départ",
    text: "Rejoins une course publique ou entre le code de ta salle de classe.",
  },
  { title: "Franchis la ligne", text: "Tape sans faute, dépasse les autres, monte sur le podium." },
];

const dossards = [
  { label: "VITESSE", value: "100", unit: "WPM", tilt: "-rotate-3" },
  { label: "SANS FAUTE", value: "10", unit: "COURSES", tilt: "rotate-2" },
  { label: "SÉRIE", value: "5", unit: "VICTOIRES", tilt: "-rotate-1" },
];

// Composant serveur (par défaut dans l'App Router). Les seuls composants
// clients de la page sont le bouton de thème et le menu de l'en-tête.
export default async function Home({ searchParams }: PageProps<"/">) {
  const { code } = await searchParams;
  const codeError = code === "invalide" || code === "introuvable" ? code : undefined;

  return (
    <>
      <SiteHeader />
      <main id="contenu" className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pt-14 pb-16">
        <section className="flex flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
            <p className="text-sourdine flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.12em] uppercase">
              <span className="bg-orange size-2.5 rounded-full" />
              Courses de frappe en direct · 2 à 30 joueurs
            </p>
            <h1 className="font-display text-[clamp(52px,7.5vw,96px)] leading-[0.92] font-extrabold tracking-tight text-balance">
              À vos claviers, prêts… <span className="text-orange-texte">go&nbsp;!</span>
            </h1>
            <p className="text-sourdine max-w-[34em] text-lg leading-relaxed">
              Tout le monde tape le même texte, en même temps. Chaque lettre juste te fait avancer.
              Le premier à franchir la ligne gagne.
            </p>
            <div>
              <Link
                href="/salles"
                className="bg-jaune font-display text-nuit inline-flex items-center gap-3 rounded-2xl px-8 py-5 text-2xl font-extrabold shadow-[0_6px_0_var(--orange)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_var(--orange)] active:translate-y-1 active:shadow-[0_2px_0_var(--orange)]"
              >
                Go ! Rejoindre une course
                <svg
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <RoomCodeForm error={codeError} />
            <p className="text-sourdine text-sm">
              Pas de compte obligatoire : choisis un pseudo et c&apos;est parti.
            </p>
          </div>
          <RaceDemo />
        </section>

        <section aria-labelledby="titre-salles" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="titre-salles" className="font-display text-5xl font-extrabold tracking-tight">
              Sur la ligne de départ
            </h2>
            <Link href="/salles" className="font-bold underline underline-offset-4">
              Voir toutes les salles
            </Link>
          </div>
          <Suspense fallback={<p className="text-sourdine">Chargement des salles…</p>}>
            <RoomList limit={3} />
          </Suspense>
        </section>

        <section id="comment" aria-labelledby="titre-comment" className="flex flex-col gap-6">
          <h2 id="titre-comment" className="font-display text-5xl font-extrabold tracking-tight">
            Comment ça marche
          </h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
            {steps.map((step, i) => (
              <li key={step.title} className="bg-surface flex flex-col gap-2 rounded-3xl p-6">
                <span className="bg-bleu font-display flex size-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="text-xl font-bold">{step.title}</span>
                <span className="text-sourdine leading-normal">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="dossards"
          aria-labelledby="titre-dossards"
          className="bg-bleu flex flex-wrap items-center gap-10 rounded-[2rem] p-9 text-white"
        >
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
            <h2
              id="titre-dossards"
              className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight"
            >
              Collectionne les dossards.
            </h2>
            <p className="text-[17px] leading-relaxed text-white/90">
              Comme à la fin d&apos;une vraie course, chaque exploit te rapporte un dossard : 100
              mots par minute, 10 courses sans faute, une série de victoires…
            </p>
          </div>
          <ul className="flex flex-[1_1_420px] flex-wrap justify-center gap-4">
            {dossards.map((d) => (
              <li
                key={d.label}
                className={`text-nuit relative flex w-36 flex-col items-center gap-1 rounded-xl bg-white px-3 pt-5 pb-3 shadow-[0_6px_0_var(--orange)] transition motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-0 ${d.tilt}`}
              >
                <span className="bg-surface-2 absolute top-2 left-2 size-2 rounded-full ring-1 ring-black/20" />
                <span className="bg-surface-2 absolute top-2 right-2 size-2 rounded-full ring-1 ring-black/20" />
                <span className="font-mono text-[11px] font-semibold tracking-wider">
                  {d.label}
                </span>
                <span className="font-display text-5xl leading-none font-extrabold">{d.value}</span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[#4F5682]">
                  {d.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-trait text-sourdine mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t-[1.5px] px-6 py-5 text-sm">
        <span>
          <Wordmark className="text-base" /> · Projet Web V · Cégep de Sorel-Tracy
        </span>
        <span>Prêts ? Tapez !</span>
      </footer>
    </>
  );
}
