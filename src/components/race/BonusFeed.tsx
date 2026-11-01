import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { BonusEvent } from "@/lib/race/bonus";

type Props = { events: BonusEvent[]; meId: string; t: Dictionary["bonus"] };

// BONUS-03 : chaque bonus est annoncé à tous, et en grand au joueur ciblé.
// Le serveur n'envoie que les bonus des dernières secondes.
export function BonusFeed({ events, meId, t }: Props) {
  const forMe = events.filter((e) => e.targetId === meId).at(-1);
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {forMe && (
        <p
          role="status"
          className={`font-display rounded-2xl px-5 py-3 text-xl font-extrabold ${
            forMe.type === "SHORTEN" ? "bg-jaune text-nuit" : "bg-encre text-piste"
          }`}
        >
          {t.forMe[forMe.type]}
        </p>
      )}
      <ul aria-label={t.feedLabel} aria-live="polite" className="flex flex-wrap gap-2">
        {events.map((e) => (
          <li
            key={`${e.at}-${e.beneficiaryId}-${e.checkpoint}`}
            className="bg-surface-2 rounded-full px-3 py-1 text-sm font-semibold"
          >
            {fmt(t.feed[e.type], { name: e.beneficiaryName, target: e.targetName })}
          </li>
        ))}
      </ul>
    </div>
  );
}
