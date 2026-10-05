import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import { LangToggle } from "./LangToggle";
import { LogoMark, Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

// En-tête commun à toutes les pages (composant serveur).
export async function SiteHeader() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-5">
      <Link href="/" className="flex items-center gap-2.5" aria-label={t.common.home}>
        <LogoMark className="size-10" />
        <Wordmark className="text-3xl" />
      </Link>
      <nav aria-label={t.common.nav} className="flex flex-wrap gap-6 text-[15px] font-semibold">
        <Link href="/salles" className="underline-offset-4 hover:underline">
          {t.common.rooms}
        </Link>
        <Link href="/#comment" className="underline-offset-4 hover:underline">
          {t.common.how}
        </Link>
        <Link href="/#dossards" className="underline-offset-4 hover:underline">
          {t.common.bibs}
        </Link>
      </nav>
      <div className="flex items-center gap-2.5">
        <UserMenu />
        <LangToggle
          next={locale === "fr" ? "en" : "fr"}
          label={t.common.switchLang}
          short={t.common.langShort}
        />
        <ThemeToggle toDark={t.common.toDark} toLight={t.common.toLight} />
      </div>
    </header>
  );
}
