"use client";

import { useRouter } from "next/navigation";

type Props = { next: "fr" | "en"; label: string; short: string };

// Composant client : enregistre la langue dans un cookie puis recharge les
// composants serveur pour afficher les textes dans l'autre langue.
export function LangToggle({ next, label, short }: Props) {
  const router = useRouter();

  function toggle() {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} className="icon-btn font-mono text-sm font-bold">
      {/* A11Y : le nom accessible contient le texte visible (« FR »), puis
          l'action, dans la langue de destination. */}
      {short}
      <span className="sr-only" lang={next}>
        {` · ${label}`}
      </span>
    </button>
  );
}
