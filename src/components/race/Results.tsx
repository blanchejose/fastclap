import { fmt, ordinal, type Dictionary, type Locale } from "@/i18n/dictionaries";
import type { RacerView } from "@/lib/race/engine";
import { Avatar } from "./Avatar";

type Props = {
  racers: RacerView[];
  meId: string;
  locale: Locale;
  t: Dictionary["results"] & { statuses: Dictionary["race"]["status"]; you: string; bot: string };
};

// Marches du podium : la 1re au centre et la plus haute (RES-01).
const steps = [
  { order: "order-2", height: "h-28", color: "bg-jaune text-nuit" },
  { order: "order-1", height: "h-20", color: "bg-bleu text-white" },
  { order: "order-3", height: "h-14", color: "bg-orange text-nuit" },
];

// Podium (RES-01), puis tableau complet (RES-02), dans l'ordre du classement
// final (COURSE-10).
export function Results({ racers, meId, locale, t }: Props) {
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    maximumFractionDigits: 1,
  });
  const seconds = (ms: number) => `${number.format(ms / 1000)} s`;
  const cell = "px-3 py-2.5 text-right font-mono tabular-nums";
  const me = racers.find((r) => r.id === meId);
  return (
    <section
      aria-labelledby="titre-resultats"
      className="bg-surface flex flex-col gap-4 rounded-3xl p-6"
    >
      <h2 id="titre-resultats" className="font-display text-4xl font-extrabold tracking-tight">
        {t.title}
      </h2>
      {me && (
        <p role="status" className="font-display text-2xl font-extrabold">
          {me.rank === 1 && me.status === "FINISHED"
            ? t.youWon
            : fmt(t.yourRank, { rank: ordinal(me.rank, locale), total: racers.length })}
        </p>
      )}
      <ol aria-label={t.podium} className="flex items-end justify-center gap-3 pt-4">
        {racers.slice(0, 3).map((r, i) => (
          <li
            key={r.id}
            className={`flex w-28 flex-col items-center gap-2 sm:w-36 ${steps[i].order}`}
          >
            <Avatar name={r.name} className="size-10" />
            <span className="max-w-full truncate text-center font-semibold">
              {r.name}
              {r.id === meId && <span className="text-sourdine"> ({t.you})</span>}
            </span>
            <span className="font-mono text-sm">
              {number.format(r.wpm)} {t.wpm}
            </span>
            <span
              className={`font-display flex w-full items-start justify-center rounded-t-2xl pt-2 text-4xl font-extrabold ${steps[i].height} ${steps[i].color}`}
            >
              {r.rank}
            </span>
          </li>
        ))}
      </ol>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <thead className="text-sourdine border-trait border-b-2 text-sm">
            <tr>
              <th scope="col" className="px-3 py-2">
                {t.rank}
              </th>
              <th scope="col" className="px-3 py-2">
                {t.player}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t.wpm}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t.rawWpm}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t.accuracy}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t.errors}
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                {t.time}
              </th>
              <th scope="col" className="px-3 py-2">
                {t.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {racers.map((r) => (
              <tr
                key={r.id}
                className={`border-trait border-b ${r.id === meId ? "bg-surface-2 font-bold" : ""}`}
              >
                <td className="font-display px-3 py-2.5 text-xl font-extrabold">{r.rank}</td>
                <th scope="row" className="px-3 py-2.5 font-semibold">
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name} className="size-6" />
                    {r.name}
                    {r.kind === "BOT" && (
                      <span className="text-sourdine font-mono text-xs">{t.bot}</span>
                    )}
                    {r.id === meId && <span className="text-sourdine text-sm">({t.you})</span>}
                  </span>
                </th>
                <td className={cell}>{number.format(r.wpm)}</td>
                <td className={cell}>{number.format(r.rawWpm)}</td>
                <td className={cell}>{number.format(r.accuracy)} %</td>
                <td className={cell}>{number.format(r.errors)}</td>
                <td className={cell}>{seconds(r.timeMs)}</td>
                <td className="px-3 py-2.5">{t.statuses[r.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
