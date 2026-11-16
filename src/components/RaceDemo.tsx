import type { Dictionary } from "@/i18n/dictionaries";
import { Runner } from "./Logo";

// Course de démonstration sur l'accueil : montre le principe en un coup d'œil.
// Le texte se tape tout seul, chaque coureur avance sur son couloir jusqu'à son
// arrivée, puis tout recommence. « Réduire les animations » fige l'état final.
// Les joueurs sont des exemples.
const lanes = [
  { name: "", wpm: 87, finish: "86%", duration: "9s", color: "var(--orange)", me: true },
  { name: "Léa", wpm: 79, finish: "76%", duration: "9.4s", color: "var(--bleu)", me: false },
  { name: "Samuel", wpm: 66, finish: "62%", duration: "9.8s", color: "var(--bleu)", me: false },
  {
    name: "Bot Pro",
    wpm: 61,
    finish: "56%",
    duration: "10.2s",
    color: "var(--sourdine)",
    me: false,
  },
];

// Une ligne de texte : le gris en dessous, le vert tapé par-dessus.
function TypedLine({ text, className }: { text: string; className: string }) {
  const n = [...text].length;
  return (
    <span className="relative block whitespace-nowrap">
      {text}
      <span
        className={`text-juste border-bleu absolute top-0 left-0 overflow-hidden border-r-2 ${className}`}
        style={{ "--n": n, width: `${n}ch` } as React.CSSProperties}
      >
        {text}
      </span>
    </span>
  );
}

export function RaceDemo({ t }: { t: Dictionary["demo"] }) {
  return (
    <figure className="bg-surface border-bleu flex min-w-0 flex-[1_1_440px] flex-col gap-4 rounded-[1.9rem] border-2 p-5 shadow-[0_8px_0_var(--bleu),0_40px_70px_-30px_rgb(36_72_255/0.55)] transition-transform duration-500 sm:p-6 md:motion-safe:[transform:perspective(1400px)_rotateY(-7deg)_rotateX(3deg)] md:motion-safe:hover:[transform:none]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sourdine flex items-center gap-2 font-mono text-xs font-semibold tracking-widest">
          <span className="live bg-juste motion-safe:animate-pulse-lent" />
          {t.label}
        </span>
        <span className="font-mono text-xl font-semibold">00:38</span>
      </div>
      {/* Le texte complet pour les lecteurs d'écran ; l'animation est décorative. */}
      <p className="bg-surface-2 text-sourdine overflow-hidden rounded-2xl px-4 py-3.5 font-mono text-[13px] leading-[1.75] sm:text-[17px]">
        <span className="sr-only">
          {t.done}
          {t.todo}
        </span>
        <span aria-hidden="true">
          <TypedLine text={t.done.trimEnd()} className="tape-l1" />
          <TypedLine text={t.todo} className="tape-l2" />
        </span>
      </p>
      <ol className="flex flex-col gap-1.5">
        {lanes.map((lane, i) => (
          <li
            key={lane.name || "moi"}
            className={`grid grid-cols-[22px_minmax(0,1fr)_68px] items-center gap-3 rounded-2xl px-2.5 py-2 ${lane.me ? "bg-surface-2" : ""}`}
          >
            <span className="font-display text-xl font-extrabold">{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-bold">{lane.name || t.you}</span>
              <div
                className="relative h-8"
                style={
                  {
                    "--arrivee": lane.finish,
                    animationDuration: lane.duration,
                  } as React.CSSProperties
                }
              >
                <span className="border-trait absolute right-6 bottom-1 left-0 border-b-2 border-dashed" />
                <span
                  className="absolute bottom-1 left-0 h-[3px] rounded-full motion-safe:animate-[remplit_9s_cubic-bezier(0.45,0,0.2,1)_infinite]"
                  style={{
                    background: lane.color,
                    width: lane.finish,
                    animationDuration: lane.duration,
                  }}
                />
                <span
                  className="motion-safe:animate-course absolute bottom-0.5 -ml-1.5"
                  style={{ color: lane.color, left: lane.finish, animationDuration: lane.duration }}
                >
                  <Runner className="size-7" />
                </span>
                <span className="damier absolute right-0 bottom-0 h-7 w-3.5 rounded-sm" />
              </div>
            </div>
            <span className="text-right font-mono text-sm font-bold">
              {lane.wpm} <span className="text-sourdine text-[11px]">{t.unit}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="text-sourdine text-sm">{t.caption}</figcaption>
    </figure>
  );
}
