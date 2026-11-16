"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

// Composant client : il lit l'adresse courante pour marquer la page active
// (aria-current), ce qui dessine le trait orange sous le lien.
export function NavLinks({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 text-[15px]">
      {items.map((item) => {
        // Les ancres de l'accueil (/#comment) ne sont jamais « la page courante ».
        const current = !item.href.includes("#") && pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="navlink"
            aria-current={current ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
