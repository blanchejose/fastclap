import type { RacerStatus } from "@/lib/race/engine";

// Statut d'un coureur : une pastille de couleur pour le repérer d'un coup
// d'œil, et toujours le mot écrit à côté (la couleur n'est jamais seule).
const dot: Record<RacerStatus, string> = {
  FINISHED: "bg-juste",
  TIME_UP: "bg-jaune",
  ABANDONED: "bg-faute",
  RACING: "bg-bleu",
};

export function StatusLabel({ status, label }: { status: RacerStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dot[status]}`} />
      {label}
    </span>
  );
}
