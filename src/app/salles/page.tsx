import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { createRoom } from "@/app/salle/actions";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { RoomList } from "@/components/RoomList";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).common.rooms };
}

// Flèche des boutons d'action.
function Fleche() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="fleche size-6"
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

export default async function RoomsPage() {
  const [t, session] = await Promise.all([getDictionary(), auth()]);

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-9 px-6 pt-14 pb-16 sm:pt-16"
      >
        <div className="motion-safe:animate-monte flex flex-col gap-3.5">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden="true" className="live bg-juste motion-safe:animate-pouls" />
            {t.explorer.live}
          </p>
          <h1 className="font-display text-[clamp(44px,6vw,72px)] leading-[0.92] font-extrabold tracking-tight">
            {t.rooms.title}
          </h1>
          <p className="text-sourdine max-w-[40em] text-lg leading-relaxed">{t.rooms.lead}</p>
        </div>

        {/* La liste est le contenu principal ; créer et rejoindre sont des
            actions secondaires, regroupées dans la colonne de droite. */}
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label={t.common.rooms} className="min-w-0">
            <Suspense fallback={<p className="text-sourdine">{t.common.loadingRooms}</p>}>
              <RoomList limit={50} filters />
            </Suspense>
          </section>

          <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-28">
            <section
              id="creer"
              aria-labelledby="titre-creer"
              className="carte motion-safe:animate-monte flex scroll-mt-28 flex-col gap-5 p-6 [animation-delay:160ms] sm:p-7"
            >
              <div className="flex flex-col gap-1.5">
                <h2
                  id="titre-creer"
                  className="font-display text-[28px] leading-tight font-extrabold"
                >
                  {t.rooms.createTitle}
                </h2>
                <p className="text-sourdine leading-relaxed">{t.rooms.createLead}</p>
              </div>
              {session ? (
                <form action={createRoom} className="flex flex-col gap-5">
                  {/* Des boutons radio dans un contrôle segmenté : le
                      formulaire marche sans JavaScript (Server Action). */}
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 font-bold">{t.rooms.visibilityLabel}</legend>
                    <div className="seg flex">
                      {(["PUBLIC", "SEMI_PUBLIC"] as const).map((visibility) => (
                        <label key={visibility}>
                          <input
                            type="radio"
                            name="visibility"
                            value={visibility}
                            defaultChecked={visibility === "PUBLIC"}
                            className="sr-only"
                          />
                          {t.visibility[visibility]}
                        </label>
                      ))}
                    </div>
                    <p className="aide-publique text-sourdine text-sm">{t.rooms.publicHint}</p>
                    <p className="aide-code text-sourdine text-sm">{t.rooms.semiHint}</p>
                  </fieldset>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 font-bold">{t.rooms.levelLabel}</legend>
                    <div className="seg flex">
                      {(["BEGINNER", "INTERMEDIATE", "PRO"] as const).map((level) => (
                        <label key={level}>
                          <input
                            type="radio"
                            name="difficulty"
                            value={level}
                            defaultChecked={level === "BEGINNER"}
                            className="sr-only"
                          />
                          {t.levels[level]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button type="submit" className="btn-go justify-between text-xl">
                    {t.rooms.create}
                    <Fleche />
                  </button>
                </form>
              ) : (
                <Link href="/connexion?suite=/salles" className="btn btn-bleu min-h-12">
                  {t.rooms.loginToCreate}
                </Link>
              )}
            </section>

            <div className="motion-safe:animate-monte [animation-delay:240ms]">
              <RoomCodeForm t={t.code} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
