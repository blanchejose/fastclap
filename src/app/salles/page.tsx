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

const radioClass =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-trait px-4 has-[:checked]:border-bleu has-[:checked]:bg-surface-2";

export default async function RoomsPage() {
  const [t, session] = await Promise.all([getDictionary(), auth()]);

  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pt-12 pb-16"
      >
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-6xl leading-[0.92] font-extrabold tracking-tight">
            {t.rooms.title}
          </h1>
          <p className="text-sourdine max-w-[40em] text-lg">{t.rooms.lead}</p>
          <RoomCodeForm t={t.code} />
        </div>

        <Suspense fallback={<p className="text-sourdine">{t.common.loadingRooms}</p>}>
          <RoomList limit={30} />
        </Suspense>

        <section
          aria-labelledby="titre-creer"
          className="bg-surface flex flex-col gap-4 rounded-3xl p-7"
        >
          <h2 id="titre-creer" className="font-display text-4xl font-extrabold tracking-tight">
            {t.rooms.createTitle}
          </h2>
          <p className="text-sourdine">{t.rooms.createLead}</p>
          {session ? (
            <form action={createRoom} className="flex flex-col gap-5">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-bold">{t.rooms.visibilityLabel}</legend>
                <label className={radioClass}>
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    defaultChecked
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.rooms.publicHint}
                </label>
                <label className={radioClass}>
                  <input
                    type="radio"
                    name="visibility"
                    value="SEMI_PUBLIC"
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.rooms.semiHint}
                </label>
              </fieldset>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-bold">{t.rooms.levelLabel}</legend>
                <div className="flex flex-wrap gap-2">
                  {(["BEGINNER", "INTERMEDIATE", "PRO"] as const).map((level) => (
                    <label key={level} className={radioClass}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        defaultChecked={level === "BEGINNER"}
                        className="size-5 accent-[var(--bleu)]"
                      />
                      {t.levels[level]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                type="submit"
                className="bg-jaune font-display text-nuit min-h-14 self-start rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
              >
                {t.rooms.create}
              </button>
            </form>
          ) : (
            <Link
              href="/connexion?suite=/salles"
              className="bg-surface-2 inline-flex min-h-12 items-center self-start rounded-xl px-5 font-bold"
            >
              {t.rooms.loginToCreate}
            </Link>
          )}
        </section>
      </main>
    </>
  );
}
