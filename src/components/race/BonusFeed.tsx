import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { BonusEvent } from "@/lib/race/bonus";

type Props = { events: BonusEvent[]; meId: string; t: Dictionary["bonus"] };

// BONUS-03 : chaque bonus est annoncé à tous, et en grand au joueur ciblé.
// Le serveur n'envoie que les bonus des dernières secondes.
export function BonusFeed({ events, meId, t }: Props) {
  const forMe = events.filter((e) => e.targetId === meId).at(-1);
  return (
    <div className="flex flex-col gap-2.5">
      {forMe && (
        <p
          key={`${forMe.at}-${forMe.checkpoint}`}
          role="status"
          className={`font-display motion-safe:animate-monte rounded-2xl px-5 py-4 text-xl leading-tight font-extrabold [animation-duration:0.4s] ${
            forMe.type === "SHORTEN" ? "bg-jaune text-nuit" : "bg-encre text-piste"
          }`}
        >
          {t.forMe[forMe.type]}
        </p>
      )}
      <ul aria-label={t.feedLabel} aria-live="polite" className="flex flex-col gap-2.5">
        {events.map((e) => (
          <li key={`${e.at}-${e.beneficiaryId}-${e.checkpoint}`} className="annonce">
            <span
              className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-sm font-bold ${
                e.type === "SHORTEN" ? "bg-jaune text-nuit" : "bg-surface-2"
              }`}
            >
              {t.names[e.type]}
            </span>
            <span className="text-[15px] leading-snug">
              {fmt(t.feed[e.type], { name: e.beneficiaryName, target: e.targetName })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
