import { Runner } from "./Logo";

// Course de démonstration sur l'accueil : montre le principe en un coup d'œil.
// Chaque coureur avance sur son couloir (animations Tailwind), sauf si l'élève
// a activé « Réduire les animations ». Les joueurs sont des exemples.
const lanes = [
  { name: "Toi", wpm: 87, finish: "78%", duration: "5.2s", color: "text-orange" },
  { name: "Léa", wpm: 79, finish: "70%", duration: "5.8s", color: "text-bleu" },
  { name: "Samuel", wpm: 66, finish: "56%", duration: "6.6s", color: "text-bleu" },
  { name: "Bot Pro", wpm: 61, finish: "50%", duration: "7.2s", color: "text-sourdine" },
];

export function RaceDemo() {
  return (
    <figure className="bg-surface ring-bleu flex min-w-0 flex-[1_1_440px] flex-col gap-4 rounded-3xl p-5 shadow-[0_8px_0_var(--bleu)] ring-2 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sourdine flex items-center gap-2 font-mono text-xs font-semibold tracking-widest">
          <span className="bg-juste motion-safe:animate-pulse-lent size-2.5 rounded-full" />
          EXEMPLE DE COURSE
        </span>
        <span className="font-mono text-xl font-semibold">00:38</span>
      </div>
      <p className="bg-surface-2 rounded-2xl px-4 py-3.5 font-mono text-[17px] leading-[1.75]">
        <span className="text-juste">Le vif renard brun saute </span>
        <span className="text-faute underline decoration-wavy">k</span>
        <span
          className="border-orange motion-safe:animate-curseur border-l-[3px]"
          aria-hidden="true"
        />
        <span className="text-sourdine">par-dessus le chien paresseux.</span>
      </p>
      <ol className="flex flex-col gap-3.5">
        {lanes.map((lane, i) => (
          <li
            key={lane.name}
            className="grid grid-cols-[22px_minmax(0,1fr)_68px] items-center gap-3"
          >
            <span className="font-display text-xl font-extrabold">{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold">{lane.name}</span>
              <div className="border-trait relative h-8 rounded-full border-b-[3px] border-dashed">
                <span
                  className={`motion-safe:animate-course absolute bottom-0 ${lane.color}`}
                  style={
                    {
                      left: lane.finish,
                      "--arrivee": lane.finish,
                      animationDuration: lane.duration,
                    } as React.CSSProperties
                  }
                >
                  <Runner className="size-7" />
                </span>
              </div>
            </div>
            <span className="text-right font-mono text-sm font-semibold">{lane.wpm} WPM</span>
          </li>
        ))}
      </ol>
      <figcaption className="text-sourdine text-sm">
        Lettre juste en vert, faute en rouge soulignée : il faut la corriger pour avancer.
      </figcaption>
    </figure>
  );
}
