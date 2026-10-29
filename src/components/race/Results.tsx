import type { Dictionary, Locale } from "@/i18n/dictionaries";
import type { RacerView } from "@/lib/race/engine";
import { Avatar } from "./Avatar";

type Props = {
  racers: RacerView[];
  meId: string;
  locale: Locale;
  t: Dictionary["results"] & { statuses: Dictionary["race"]["status"]; you: string; bot: string };
};

// Tableau des résultats (RES-02), dans l'ordre du classement final (COURSE-10).
export function Results({ racers, meId, locale, t }: Props) {
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    maximumFractionDigits: 1,
  });
  const seconds = (ms: number) => `${number.format(ms / 1000)} s`;
  const cell = "px-3 py-2.5 text-right font-mono tabular-nums";
  return (
    <section
      aria-labelledby="titre-resultats"
      className="bg-surface flex flex-col gap-4 rounded-3xl p-6"
    >
      <h2 id="titre-resultats" className="font-display text-4xl font-extrabold tracking-tight">
        {t.title}
      </h2>
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
