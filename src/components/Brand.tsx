import Link from "next/link";
import { Logo } from "./Logo";

// Logo dans l'en-tête de toutes les pages, avec retour à l'accueil.
export function Brand() {
  return (
    <Link href="/" aria-label="FastClap, accueil" className="block w-20 sm:w-24">
      <Logo priority />
    </Link>
  );
}
