"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

// Le thème vit sur <html data-theme>. On s'abonne à ses changements pour
// que le libellé du bouton reste synchronisé.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

// Composant client : il a besoin du DOM, de localStorage et des événements.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Stockage indisponible (navigation privée) : le thème vaut pour la session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="border-muted/40 text-muted hover:text-foreground focus-visible:outline-info rounded-full border px-4 py-1.5 text-sm focus-visible:outline-2"
    >
      {theme === "dark" ? "Mode clair" : "Mode sombre"}
    </button>
  );
}
