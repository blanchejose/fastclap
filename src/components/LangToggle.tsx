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
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      lang={next}
      className="border-trait hover:bg-surface-2 flex h-11 min-w-11 items-center justify-center rounded-md border-[1.5px] px-2.5 font-mono text-sm font-semibold transition"
    >
      {short}
    </button>
  );
}
