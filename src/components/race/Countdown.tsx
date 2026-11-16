import { fmt, type Dictionary } from "@/i18n/dictionaries";

// Décompte 3, 2, 1, Go ! calé sur l'heure du serveur (COURSE-03), en plein
// écran sur un voile sombre. Chaque chiffre est un nouvel élément (key) : son
// animation repart à zéro. Le voile laisse passer les clics.
export function Countdown({ msLeft, t }: { msLeft: number; t: Dictionary["race"] }) {
  const go = msLeft <= 0;
  const n = Math.max(1, Math.ceil(msLeft / 1000));
  return (
    <div role="status" aria-live="assertive" className={`decompte ${go ? "fin" : ""}`}>
      <span className="sr-only">{go ? t.go : fmt(t.countdown, { n })}</span>
      <span key={go ? "go" : n} aria-hidden="true" className={`chiffre ${go ? "go" : ""}`}>
        {go ? t.go : n}
      </span>
    </div>
  );
}
