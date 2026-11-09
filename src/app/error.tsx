"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dictionaries, type Locale } from "@/i18n/dictionaries";

// La langue de la page (balise <html lang>) : la page d'erreur est un
// composant client et ne peut pas lire le cookie côté serveur.
const subscribe = () => () => {};
const readLocale = (): Locale => (document.documentElement.lang === "en" ? "en" : "fr");

// Erreur inattendue pendant l'affichage d'une page, traduite (I18N-01).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => "fr" as Locale);
  const t = dictionaries[locale].errors;
  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-6 px-6 pt-14 pb-16"
    >
      <h1 className="font-display text-6xl leading-[0.92] font-extrabold tracking-tight">
        {t.errorTitle}
      </h1>
      <p className="text-sourdine max-w-[40em] text-lg">{t.errorText}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-jaune font-display text-nuit min-h-14 rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
        >
          {t.retry}
        </button>
        <Link
          href="/"
          className="bg-surface inline-flex min-h-14 items-center rounded-2xl px-6 font-bold"
        >
          {t.home}
        </Link>
      </div>
    </main>
  );
}
