// Duel de démonstration sur l'accueil : montre le principe en un coup d'œil.
// Les barres avancent en boucle (animations Tailwind), sauf si l'élève a
// activé « Réduire les animations ». Les joueurs sont des exemples.
const lanes = [
  {
    initial: "T",
    name: "Toi",
    pct: "64%",
    wpm: 87,
    color: "bg-carton",
    bar: "bg-encre",
    duration: "6s",
  },
  {
    initial: "L",
    name: "Léa",
    pct: "57%",
    wpm: 79,
    color: "bg-[#9FD8C4]",
    bar: "bg-sourdine",
    duration: "6.8s",
  },
  {
    initial: "S",
    name: "Samuel",
    pct: "41%",
    wpm: 66,
    color: "bg-[#F4B6A8]",
    bar: "bg-sourdine",
    duration: "7.6s",
  },
  {
    initial: "B",
    name: "Bot Pro",
    pct: "33%",
    wpm: 61,
    color: "bg-[#C9CCD1]",
    bar: "bg-sourdine",
    duration: "8.4s",
  },
];

export function DuelDemo() {
  return (
    <figure className="border-encre bg-surface flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-xl border-2 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-juste motion-safe:animate-lampe h-4.5 w-8.5 rounded" />
          <span className="bg-faute h-4.5 w-8.5 rounded" />
          <span className="text-sourdine ml-1.5 font-mono text-xs font-semibold tracking-widest">
            EXEMPLE DE DUEL
          </span>
        </div>
        <span className="font-mono text-xl font-semibold">00:38</span>
      </div>
      <p className="bg-surface-2 rounded-md px-4 py-3.5 font-mono text-[17px] leading-[1.75]">
        <span className="text-juste">Le renard brun saute </span>
        <span className="text-faute underline decoration-wavy">k</span>
        <span
          className="border-encre motion-safe:animate-curseur border-l-[3px]"
          aria-hidden="true"
        />
        <span className="text-sourdine">par-dessus le chien qui dort au soleil.</span>
      </p>
      <ol className="flex flex-col gap-3">
        {lanes.map((lane, i) => (
          <li
            key={lane.name}
            className="grid grid-cols-[26px_36px_minmax(0,1fr)_64px] items-center gap-2.5"
          >
            <span className="font-display text-2xl font-black">{i + 1}</span>
            <span
              className={`flex size-9 items-center justify-center rounded-lg text-sm font-bold text-[#121316] ${lane.color}`}
              aria-hidden="true"
            >
              {lane.initial}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold">{lane.name}</span>
              <div className="bg-surface-2 h-2 overflow-hidden rounded-sm">
                <div
                  className={`motion-safe:animate-avance h-full origin-left ${lane.bar}`}
                  style={{ width: lane.pct, animationDuration: lane.duration }}
                />
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
