import type { Dictionary } from "@/i18n/dictionaries";
import { isGuestId } from "@/lib/guest-id";
import type { BonusType } from "@/lib/race/bonus";
import type { RacerView } from "@/lib/race/engine";
import { Runner } from "../Logo";

type Props = {
  racers: RacerView[];
  meId: string;
  // Progression et MPM du joueur local, calculés dans son navigateur : son
  // coureur bouge à chaque touche, sans attendre le serveur.
  local: { progress: number; wpm: number } | null;
  t: Dictionary["race"] & { you: string; bot: string; guest: string };
  // BONUS-03 : effet de bonus en cours sur chaque coureur (id → type).
  effects: Record<string, BonusType>;
  bonusNames: Dictionary["bonus"]["names"];
};

// La piste, élément signature de FastClap (COURSE-05) : un couloir par
// participant, le coureur avance vers la ligne d'arrivée à damier en laissant
// une trace. Le serveur envoie les positions 10 fois par seconde ; la
// transition CSS de 150 ms interpole entre deux positions pour un mouvement
// fluide. Chaque coureur garde son couloir : seul le rang affiché change.
export function Track({ racers, meId, local, t, effects, bonusNames }: Props) {
  return (
    <section aria-labelledby="titre-piste" className="couloirs motion-safe:animate-monte">
      <h2 id="titre-piste" className="sr-only">
        {t.track}
      </h2>
      <ol>
        {[...racers]
          .sort((a, b) => a.lane - b.lane)
          .map((racer) => {
            const isMe = racer.id === meId;
            const progress = isMe && local ? local.progress : racer.progress;
            const wpm = isMe && local ? local.wpm : racer.wpm;
            const effect = effects[racer.id];
            const color = isMe
              ? "text-orange"
              : racer.kind === "BOT"
                ? "text-sourdine"
                : "text-bleu";
            const moving =
              "transition-transform duration-150 ease-linear motion-reduce:transition-none";
            return (
              <li key={racer.id} className={`couloir ${isMe ? "moi" : ""}`}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex min-w-0 items-center gap-2 font-bold">
                    <span className="text-sourdine font-mono text-[13px]">
                      {String(racer.rank).padStart(2, "0")}
                    </span>
                    <span className="truncate">{racer.name}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {racer.kind === "BOT" && <span className="badge">{t.bot}</span>}
                    {isGuestId(racer.id) && <span className="badge">{t.guest}</span>}
                    {isMe && <span className="badge">{t.you}</span>}
                    {effect && (
                      <span
                        className={`badge ${effect === "SHORTEN" ? "badge-hote" : "bg-encre! text-piste!"}`}
                      >
                        {bonusNames[effect]}
                      </span>
                    )}
                    {racer.status !== "RACING" && (
                      <span className="text-sourdine text-xs font-semibold">
                        {t.status[racer.status]}
                      </span>
                    )}
                  </span>
                </span>
                <div className={`voie ${color}`} aria-hidden="true">
                  <span
                    className={`trace ${moving}`}
                    style={{ transform: `scaleX(${progress})` }}
                  />
                  <span className="arrivee" />
                  <span
                    className={`coureur will-change-transform ${moving}`}
                    style={{ transform: `translateX(${progress * 100}%)` }}
                  >
                    <Runner className="size-10" />
                  </span>
                </div>
                <span className="text-right font-mono font-bold tabular-nums">
                  {wpm} <span className="text-sourdine text-[11px]">{t.wpm}</span>
                </span>
              </li>
            );
          })}
      </ol>
    </section>
  );
}
