import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

// En-tête commun à toutes les pages (composant serveur).
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-5">
      <Link href="/" className="flex items-center gap-2.5" aria-label="FastClap, accueil">
        <LogoMark className="size-10" />
        <Wordmark className="text-3xl" />
      </Link>
      <nav
        aria-label="Navigation principale"
        className="flex flex-wrap gap-6 text-[15px] font-semibold"
      >
        <Link href="/salles" className="underline-offset-4 hover:underline">
          Salles
        </Link>
        <Link href="/#comment" className="underline-offset-4 hover:underline">
          Comment ça marche
        </Link>
        <Link href="/#dossards" className="underline-offset-4 hover:underline">
          Dossards
        </Link>
      </nav>
      <div className="flex items-center gap-2.5">
        <UserMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
