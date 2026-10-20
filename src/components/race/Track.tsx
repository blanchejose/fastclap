import type { Dictionary } from "@/i18n/dictionaries";
import type { RacerView } from "@/lib/race/engine";
import { Runner } from "../Logo";
import { Avatar } from "./Avatar";

type Props = {
  racers: RacerView[];
  meId: string;
  // Progression et MPM du joueur local, calculés dans son navigateur : son
  // coureur bouge à chaque touche, sans attendre le serveur.
  local: { progress: number; wpm: number } | null;
  t: Dictionary["race"] & { you: string; bot: string };
};

// La piste, élément signature de FastClap (COURSE-05) : un couloir par
// participant, le coureur avance vers la ligne d'arrivée à damier. Le serveur
// envoie les positions 10 fois par seconde ; la transition CSS de 150 ms
// interpole entre deux positions pour un mouvement fluide. Chaque coureur
// garde son couloir : seul le rang affiché change quand il double.
export function Track({ racers, meId, local, t }: Props) {
  return (
    <section
      aria-labelledby="titre-piste"
      className="bg-surface flex flex-col gap-3 rounded-3xl p-5"
    >
      <h2 id="titre-piste" className="sr-only">
        {t.track}
      </h2>
      <ol className="flex flex-col gap-1">
        {[...racers]
          .sort((a, b) => a.lane - b.lane)
          .map((racer) => {
            const isMe = racer.id === meId;
            const progress = isMe && local ? local.progress : racer.progress;
            const wpm = isMe && local ? local.wpm : racer.wpm;
            return (
              <li
                key={racer.id}
                className={`grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem] items-center gap-3 rounded-2xl px-2 py-1.5 ${
                  isMe ? "bg-surface-2 ring-bleu ring-2" : ""
                }`}
              >
                <span className="font-display text-center text-xl font-extrabold">
                  {racer.rank}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <Avatar name={racer.name} className="size-6" />
                    <span className={`truncate ${isMe ? "font-extrabold" : "font-semibold"}`}>
                      {racer.name}
                    </span>
                    {racer.kind === "BOT" && (
                      <span className="bg-surface-2 text-sourdine rounded px-1.5 font-mono text-[11px] font-bold">
                        {t.bot}
                      </span>
                    )}
                    {isMe && <span className="text-sourdine">({t.you})</span>}
                    {racer.status !== "RACING" && (
                      <span className="text-sourdine text-xs">· {t.status[racer.status]}</span>
                    )}
                  </span>
                  <div className="border-trait relative h-8 rounded-full border-b-[3px] border-dashed">
                    {/* Ligne d'arrivée à damier. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 right-0 w-2 bg-[repeating-conic-gradient(var(--encre)_0_25%,transparent_0_50%)] bg-[length:8px_8px] opacity-60"
                    />
                    <div
                      className="absolute bottom-0 left-0 w-[calc(100%-2rem)] transition-transform duration-150 ease-linear will-change-transform motion-reduce:transition-none"
                      style={{ transform: `translateX(${progress * 100}%)` }}
                    >
                      <span
                        className={
                          isMe
                            ? "text-orange"
                            : racer.kind === "BOT"
                              ? "text-sourdine"
                              : "text-bleu"
                        }
                      >
                        <Runner className="size-8" />
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-right font-mono text-sm font-semibold">
                  {wpm} {t.wpm}
                </span>
              </li>
            );
          })}
      </ol>
    </section>
  );
}
