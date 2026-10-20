import { fmt, type Dictionary } from "@/i18n/dictionaries";

// Décompte 3, 2, 1 calé sur l'heure du serveur (COURSE-03).
export function Countdown({ msLeft, t }: { msLeft: number; t: Dictionary["race"] }) {
  const n = Math.max(1, Math.ceil(msLeft / 1000));
  return (
    <div
      role="status"
      aria-live="assertive"
      className="bg-jaune text-nuit font-display flex items-center justify-center gap-4 rounded-3xl px-6 py-5 text-4xl font-extrabold shadow-[0_6px_0_var(--orange)]"
    >
      <span className="sr-only">{fmt(t.countdown, { n })}</span>
      <span aria-hidden="true" className="text-7xl tabular-nums">
        {n}
      </span>
    </div>
  );
}
