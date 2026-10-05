import Link from "next/link";
import { Suspense } from "react";
import { DuelDemo } from "@/components/DuelDemo";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { RoomList } from "@/components/RoomList";
import { SiteHeader } from "@/components/SiteHeader";

const steps = [
  {
    title: "Choisis ton pseudo",
    text: "Ou connecte-toi avec Discord ou GitHub pour garder tes stats.",
  },
  {
    title: "Monte sur la piste",
    text: "Rejoins un duel public ou entre le code de ta salle de classe.",
  },
  {
    title: "Touche, touche, touche",
    text: "Tape sans faute, dépasse les autres, finis sur le podium.",
  },
];

const cartons = [
  { label: "CARTON JAUNE", value: "100 WPM", color: "bg-carton", tilt: "-rotate-6" },
  { label: "SANS FAUTE", value: "10 DUELS", color: "bg-[#9FD8C4]", tilt: "rotate-3" },
  { label: "SÉRIE", value: "5 VICTOIRES", color: "bg-[#F4B6A8]", tilt: "-rotate-2" },
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
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
            <p className="text-sourdine flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.12em] uppercase">
              <span className="bg-juste size-2.5 rounded-full" />
              Duels de frappe en direct · 2 à 30 joueurs
            </p>
            <h1 className="font-display text-[clamp(56px,8vw,104px)] leading-[0.9] font-black uppercase">
              Tes doigts contre ta classe.
            </h1>
            <p className="text-sourdine max-w-[34em] text-lg leading-relaxed">
              Tout le monde tape le même texte, en même temps. Chaque lettre juste est une touche.
              La première sur la piste gagne.
            </p>
            <div>
              <Link
                href="/salles"
                className="bg-cta font-display text-cta-encre inline-flex items-center gap-3.5 rounded-lg px-9 py-5 text-3xl font-black tracking-wide uppercase shadow-[6px_6px_0_var(--faute)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--faute)]"
              >
                En garde ! Rejoindre un duel
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
          <DuelDemo />
        </section>

        <section aria-labelledby="titre-salles" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="titre-salles" className="font-display text-5xl font-black uppercase">
              Sur la piste en ce moment
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
          <h2 id="titre-comment" className="font-display text-5xl font-black uppercase">
            Comment ça marche
          </h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
            {steps.map((step, i) => (
              <li key={step.title} className="border-encre flex flex-col gap-2 border-t-4 pt-4">
                <span className="font-display text-faute text-6xl leading-none font-black">
                  {i + 1}
                </span>
                <span className="text-xl font-bold">{step.title}</span>
                <span className="text-sourdine leading-normal">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="cartons"
          aria-labelledby="titre-cartons"
          className="bg-cta text-cta-encre flex flex-wrap items-center gap-8 rounded-2xl p-9"
        >
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
            <h2
              id="titre-cartons"
              className="font-display text-5xl leading-[0.95] font-black uppercase"
            >
              Collectionne les cartons.
            </h2>
            <p className="text-[17px] leading-relaxed opacity-85">
              En escrime, l&apos;arbitre sort des cartons. Ici, tu les gagnes : 100 mots par minute,
              10 duels sans faute, une série de victoires…
            </p>
          </div>
          <ul className="flex flex-[1_1_420px] flex-wrap justify-center gap-3.5">
            {cartons.map((carton) => (
              <li
                key={carton.label}
                className={`flex h-40 w-36 flex-col justify-between rounded-xl p-3.5 text-[#121316] transition motion-safe:hover:rotate-0 ${carton.color} ${carton.tilt}`}
              >
                <span className="font-mono text-[11px] font-semibold tracking-wider">
                  {carton.label}
                </span>
                <span className="font-display text-4xl leading-[0.9] font-black">
                  {carton.value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-trait text-sourdine mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 border-t-[1.5px] px-6 py-5 text-sm">
        <span>Touché · Projet Web V · Cégep de Sorel-Tracy</span>
        <span>Chaque touche compte.</span>
      </footer>
    </>
  );
}
