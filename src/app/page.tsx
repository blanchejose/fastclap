import Link from "next/link";
import { Suspense } from "react";
import { Bib } from "@/components/Bib";
import { Runner } from "@/components/Logo";
import { RaceDemo } from "@/components/RaceDemo";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { RoomList } from "@/components/RoomList";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";

// Inclinaison de départ de chaque dossard (ils se balancent autour).
const swings = ["-4deg", "3deg", "-2deg"];

// Touches qui flottent en décor autour du titre.
const keys = [
  { letter: "F", className: "top-6 left-[46%] size-16 text-[26px]", r: "-8deg", delay: "0s" },
  { letter: "A", className: "bottom-10 left-[44%] size-16 text-[26px]", r: "10deg", delay: "-2s" },
  { letter: "T", className: "top-2 right-0 size-13 text-[22px]", r: "6deg", delay: "-4s" },
];

function Fleche({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fleche ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Composant serveur (par défaut dans l'App Router). Les animations sont en CSS :
// aucun JavaScript de plus n'est envoyé au navigateur pour elles.
export default async function Home({ searchParams }: PageProps<"/">) {
  const [{ code }, t] = await Promise.all([searchParams, getDictionary()]);
  const codeError =
    code === "invalide" || code === "introuvable" || code === "prive" || code === "trop"
      ? code
      : undefined;
  const h = t.home;

  return (
    <>
      <SiteHeader />
      <main id="contenu" className="flex w-full flex-col overflow-x-clip">
        <section className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-14 px-6 pt-16 pb-24 sm:pt-20">
          {keys.map((key) => (
            <span
              key={key.letter}
              aria-hidden="true"
              className={`bg-surface border-trait font-display text-bleu motion-safe:animate-flotte absolute hidden items-center justify-center rounded-2xl border font-extrabold opacity-90 shadow-[0_6px_0_var(--trait)] lg:flex ${key.className}`}
              style={{ "--r": key.r, animationDelay: key.delay } as React.CSSProperties}
            >
              {key.letter}
            </span>
          ))}

          <div className="relative flex min-w-0 flex-[1_1_480px] flex-col gap-6">
            <p className="text-sourdine motion-safe:animate-monte flex items-center gap-3 font-mono text-xs font-semibold tracking-[0.12em] uppercase">
              <span className="live motion-safe:animate-pouls" />
              {h.eyebrow}
            </p>
            <h1 className="font-display text-[clamp(52px,7.4vw,104px)] leading-[0.9] font-extrabold tracking-tight">
              <span className="motion-safe:animate-monte block [animation-delay:80ms]">
                {h.title}
              </span>{" "}
              <span className="text-orange-texte motion-safe:animate-monte inline-flex items-center gap-4 [animation-delay:240ms]">
                <span aria-hidden="true" className="flex w-16 flex-col gap-2">
                  <span className="bg-orange motion-safe:animate-trainee block h-2 w-16 origin-right rounded-full" />
                  <span className="bg-orange motion-safe:animate-trainee ml-5 block h-2 w-11 origin-right rounded-full [animation-delay:200ms]" />
                  <span className="bg-orange motion-safe:animate-trainee ml-2 block h-2 w-14 origin-right rounded-full [animation-delay:400ms]" />
                </span>
                {h.titleGo}
              </span>
            </h1>
            <p className="text-sourdine motion-safe:animate-monte max-w-[32em] text-lg leading-relaxed [animation-delay:320ms] sm:text-[19px]">
              {h.lead}
            </p>
            <div className="motion-safe:animate-monte [animation-delay:440ms]">
              {/* JOIN-03 : « Faire une course » mène à la salle la plus proche de sa capacité. */}
              <Link href="/go" className="btn-go text-xl sm:text-2xl">
                {h.cta}
                <Fleche className="size-7" />
              </Link>
            </div>
            <div className="motion-safe:animate-monte [animation-delay:560ms]">
              <RoomCodeForm t={t.code} error={codeError} note={h.noAccount} />
            </div>
          </div>
          <div className="motion-safe:animate-monte flex min-w-0 flex-[1_1_440px] [animation-delay:320ms]">
            <RaceDemo t={t.demo} />
          </div>
        </section>

        {/* Bandeau des slogans : décoratif, les mots sont déjà dans la page. */}
        <div
          aria-hidden="true"
          className="bg-bleu -mx-10 -rotate-[1.5deg] overflow-hidden py-5 text-white shadow-[0_8px_0_var(--orange)]"
        >
          <div className="font-display motion-safe:animate-defile flex w-max text-[40px] font-extrabold tracking-tight">
            {[...h.marquee, ...h.marquee].map((word, i) => (
              <span key={i} className="inline-flex items-center gap-9 pr-9">
                {word}
                <span className="bg-jaune size-3.5 rotate-45 rounded-[4px]" />
              </span>
            ))}
          </div>
        </div>

        <section
          aria-labelledby="titre-salles"
          className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-6 pt-28 pb-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <p className="eyebrow">{h.roomsEyebrow}</p>
              <h2
                id="titre-salles"
                className="font-display text-[clamp(40px,5vw,60px)] leading-none font-extrabold tracking-tight text-balance"
              >
                {h.roomsTitle}
              </h2>
            </div>
            <Link href="/salles" className="inline-flex items-center gap-2 font-bold">
              {h.allRooms}
              <Fleche className="size-5" />
            </Link>
          </div>
          <Suspense fallback={<p className="text-sourdine">{t.common.loadingRooms}</p>}>
            <RoomList limit={3} />
          </Suspense>
        </section>

        <section
          id="comment"
          aria-labelledby="titre-comment"
          className="mx-auto flex w-full max-w-6xl scroll-mt-28 flex-col gap-14 px-6 pt-24 pb-14"
        >
          <div className="flex flex-col items-center gap-2.5 text-center">
            <p className="eyebrow">{h.howEyebrow}</p>
            <h2
              id="titre-comment"
              className="font-display text-[clamp(40px,5vw,60px)] leading-none font-extrabold tracking-tight text-balance"
            >
              {h.howTitle}
            </h2>
          </div>
          {/* La piste qui relie les étapes, avec un coureur qui la parcourt. */}
          <div
            aria-hidden="true"
            className="border-trait relative mx-[16%] hidden border-t-[3px] border-dashed md:block"
          >
            <span className="text-orange motion-safe:animate-traverse absolute -top-4 -ml-4">
              <Runner className="size-8" />
            </span>
          </div>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 md:-mt-10">
            {h.steps.map((step, i) => (
              <li
                key={step.title}
                className="carte group flex flex-col items-center gap-3.5 px-7 py-8 text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="bg-bleu font-display flex size-16 items-center justify-center rounded-[18px] text-3xl font-extrabold text-white shadow-[0_10px_22px_-10px_rgb(36_72_255/0.6)] transition-transform group-hover:-translate-y-1 group-hover:-rotate-6">
                  {i + 1}
                </span>
                <span className="font-display text-2xl font-extrabold">{step.title}</span>
                <span className="text-sourdine leading-relaxed">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="dossards"
          aria-labelledby="titre-dossards"
          className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 pt-14"
        >
          <div className="bg-bleu relative flex flex-wrap items-center gap-12 overflow-hidden rounded-[2.25rem] p-7 text-white sm:p-14">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_118px,rgb(255_255_255/0.07)_118px_120px)]"
            />
            <div className="relative flex min-w-0 flex-[1_1_340px] flex-col gap-4">
              <h2
                id="titre-dossards"
                className="font-display text-[clamp(40px,5vw,60px)] leading-[0.95] font-extrabold tracking-tight text-balance"
              >
                {h.bibsTitle}
              </h2>
              <p className="max-w-[30em] text-lg leading-relaxed text-white">{h.bibsText}</p>
              <Link
                href="/connexion"
                className="btn text-nuit mt-2 self-start bg-white text-[15px]"
              >
                {t.common.login}
              </Link>
            </div>
            <ul className="relative flex flex-[1_1_440px] flex-wrap justify-center gap-6 pt-7 *:w-[150px]">
              {h.bibs.map((d, i) => (
                <Bib key={d.label} {...d} swing={swings[i]} delay={`${-1.3 * i}s`} large />
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
