import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Runner } from "@/components/Logo";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).errors.notFoundTitle };
}

// Page introuvable, traduite (I18N-01) : remplace la page anglaise de Next.js.
export default async function NotFound() {
  const t = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-6 px-6 pt-14 pb-16"
      >
        <span className="text-orange">
          <Runner className="size-16" />
        </span>
        <h1 className="font-display text-6xl leading-[0.92] font-extrabold tracking-tight">
          {t.errors.notFoundTitle}
        </h1>
        <p className="text-sourdine max-w-[40em] text-lg">{t.errors.notFoundText}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-jaune font-display text-nuit inline-flex min-h-14 items-center rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
          >
            {t.errors.home}
          </Link>
          <Link
            href="/salles"
            className="bg-surface inline-flex min-h-14 items-center rounded-2xl px-6 font-bold"
          >
            {t.common.rooms}
          </Link>
        </div>
      </main>
    </>
  );
}
