import Link from "next/link";
import { auth } from "@/auth";
import { getDictionary, getLocale } from "@/i18n/server";
import { LangToggle } from "./LangToggle";
import { LogoMark, Wordmark } from "./Logo";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

// En-tête commun (composant serveur) : une barre flottante en verre dépoli qui
// reste en haut de l'écran pendant le défilement.
export async function SiteHeader() {
  const [locale, t, session] = await Promise.all([getLocale(), getDictionary(), auth()]);

  const items = [
    { href: "/salles", label: t.common.rooms },
    // HIST-01 : l'historique, pour les utilisateurs connectés.
    ...(session ? [{ href: "/historique", label: t.common.history }] : []),
    { href: "/#comment", label: t.common.how },
    { href: "/#dossards", label: t.common.bibs },
  ];

  return (
    <header className="relative z-20 px-4 pt-3 sm:px-6 md:sticky md:top-3">
      <div className="bg-surface/80 border-trait mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[1.4rem] border py-2.5 pr-3 pl-4 shadow-[0_12px_32px_-12px_rgb(13_18_64/0.18)] backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5" aria-label={t.common.home}>
          <LogoMark className="size-10" />
          <Wordmark className="text-[1.75rem]" />
        </Link>
        <div className="order-last w-full md:order-none md:w-auto">
          <NavLinks items={items} label={t.common.nav} />
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <LangToggle
            next={locale === "fr" ? "en" : "fr"}
            label={t.common.switchLang}
            short={t.common.langShort}
          />
          <ThemeToggle toDark={t.common.toDark} toLight={t.common.toLight} />
        </div>
      </div>
    </header>
  );
}
