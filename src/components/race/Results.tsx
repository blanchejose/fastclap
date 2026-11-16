import type { CSSProperties, ReactNode } from "react";
import { fmt, ordinal, type Dictionary, type Locale } from "@/i18n/dictionaries";
import type { RacerView } from "@/lib/race/engine";
import { Avatar } from "./Avatar";
import { KeyHeatmap } from "./KeyHeatmap";
import { StatusLabel } from "./StatusLabel";
import { WpmChart } from "./WpmChart";

type Props = {
  racers: RacerView[];
  meId: string;
  records: string[]; // RES-04 : coureurs qui ont battu leur record personnel
  locale: Locale;
  code?: string; // code de la salle, dans l'étiquette « Résultats · Salle … »
  actions?: ReactNode; // prochaines actions, centrées sous les résultats
  t: Dictionary["results"] & {
    statuses: Dictionary["race"]["status"];
    you: string;
    bot: string;
    bonusNames: Dictionary["bonus"]["names"];
    charts: Dictionary["charts"];
  };
};

// Marches du podium, dans l'ordre du classement : la 1re au centre, jaune et
// la plus haute (RES-01). Les délais font monter la 3e, puis la 2e, puis la 1re.
const STEPS = [
  { metal: "or", order: "order-2", height: "14.4rem", delay: 0, trophy: 0.8, who: 1 },
  { metal: "argent", order: "order-1", height: "10.6rem", delay: 0.2, trophy: 0.65, who: 0.7 },
  { metal: "bronze", order: "order-3", height: "7.5rem", delay: 0.4, trophy: 0.5, who: 0.9 },
] as const;

// Couleurs des trophées : métal clair, métal foncé, reflet.
const METALS = {
  or: ["#FFD23F", "#F2A900", "#FFF1B8"],
  argent: ["#DCE2F2", "#9AA6C8", "#FFFFFF"],
  bronze: ["#E7A06A", "#B5652F", "#FFD9BC"],
} as const;

const CONFETTI = ["#FFD23F", "#FF7A45", "#2448FF", "#3DD68C", "#9EC5F4"];

// Confettis de la carte des résultats : positions fixes (pas de hasard au rendu, le HTML
// du serveur et celui du navigateur restent identiques).
function Confetti() {
  return (
    <div aria-hidden="true" className="confettis">
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI[i % CONFETTI.length],
            animationDuration: `${3 + ((4 - (i % 4)) % 4)}s`,
            animationDelay: `${-((i * 0.43) % 4).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

function Trophy({
  metal,
  rank,
  label,
}: {
  metal: keyof typeof METALS;
  rank: number;
  label: string;
}) {
  const [light, dark, shine] = METALS[metal];
  const clip = `coupe-${metal}`;
  const cup = "M17 6h30v18a15 15 0 0 1-30 0z";
  return (
    <svg viewBox="0 0 64 72" className={`trophee ${metal}`} role="img" aria-label={label}>
      <defs>
        <clipPath id={clip}>
          <path d={cup} />
        </clipPath>
      </defs>
      <path
        d="M17 11H9v5a9 9 0 0 0 9 9"
        fill="none"
        stroke={dark}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M47 11h8v5a9 9 0 0 1-9 9"
        fill="none"
        stroke={dark}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d={cup} fill={light} />
      <g clipPath={`url(#${clip})`}>
        <rect
          className="eclat"
          x="26"
          y="0"
          width="7"
          height="44"
          fill="#fff"
          transform="skewX(-18)"
        />
      </g>
      <path d="M22 10v12" stroke={shine} strokeWidth="3" strokeLinecap="round" />
      <rect x="29" y="38" width="6" height="10" fill={dark} />
      <rect x="21" y="48" width="22" height="8" rx="2" fill={light} />
      <rect x="16" y="56" width="32" height="9" rx="3" fill={dark} />
      <text
        x="32"
        y="29"
        textAnchor="middle"
        className="font-display"
        fontWeight="800"
        fontSize="16"
        fill="#0D1240"
      >
        {rank}
      </text>
    </svg>
  );
}

function Star({ size, style }: { size: number; style: CSSProperties }) {
  return (
    <span className="etoile" aria-hidden="true" style={style}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
      </svg>
    </span>
  );
}

// Mise en page de la maquette validée : la carte du verdict avec les
// confettis et le podium posé en bas (RES-01) ; dessous, le classement complet
// (RES-02, COURSE-10) à gauche, les graphiques à droite (RES-03) ; puis les
// actions, centrées.
export function Results({ racers, meId, records, locale, code, actions, t }: Props) {
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    maximumFractionDigits: 1,
  });
  const seconds = (ms: number) => `${number.format(ms / 1000)} s`;
  const me = racers.find((r) => r.id === meId);
  const won = me?.rank === 1 && me.status === "FINISHED";
  const cell = "text-right font-mono tabular-nums";
  const shownCode = code ? `${code.slice(0, 3)}-${code.slice(3)}` : null;

  return (
    <div className="flex flex-col gap-7">
      <section
        aria-labelledby="titre-resultats"
        className="carte motion-safe:animate-monte relative flex flex-col items-center gap-3 overflow-hidden px-4 pt-8 text-center sm:px-10 sm:pt-10"
      >
        <Confetti />
        <h2 id="titre-resultats" className="eyebrow relative">
          {t.title}
          {shownCode && ` · ${fmt(t.room, { code: shownCode })}`}
        </h2>
        {me && (
          <p
            role="status"
            className="font-display motion-safe:animate-monte relative text-[clamp(2.4rem,6vw,4.75rem)] leading-[0.95] font-extrabold tracking-tight"
          >
            {won
              ? t.youWon
              : fmt(t.yourRank, { rank: ordinal(me.rank, locale), total: racers.length })}
          </p>
        )}
        {me && records.includes(me.id) && (
          <p className="bandeau relative mt-1.5">
            {fmt(t.newRecord, { wpm: number.format(me.wpm) })}
          </p>
        )}

        <ol aria-label={t.podium} className="podium relative">
          {racers.slice(0, 3).map((r, i) => {
            const step = STEPS[i];
            return (
              <li key={r.id} className={`marche ${step.order}`}>
                {i === 0 && (
                  <>
                    <Star size={18} style={{ top: 0, left: "0.6rem", animationDelay: "1.6s" }} />
                    <Star
                      size={14}
                      style={{ top: "2rem", right: "0.3rem", animationDelay: "2.1s" }}
                    />
                    <Star size={12} style={{ top: "5rem", left: 0, animationDelay: "2.6s" }} />
                  </>
                )}
                <span className="trophee-boite" style={{ animationDelay: `${step.trophy}s` }}>
                  <Trophy
                    metal={step.metal}
                    rank={r.rank}
                    label={fmt(t.trophy, { rank: ordinal(r.rank, locale) })}
                  />
                </span>
                <span className="qui" style={{ animationDelay: `${step.who}s` }}>
                  <Avatar
                    name={r.name}
                    src={r.avatar}
                    className="size-[30px] shrink-0 rounded-[10px] text-[11px]"
                  />
                  <span className="min-w-0 truncate">{r.name}</span>
                  <span className="text-sourdine font-mono text-sm font-bold whitespace-nowrap tabular-nums">
                    {number.format(r.wpm)} {t.wpm}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`bloc ${i === 0 ? "premier" : ""}`}
                  style={{ "--h": step.height, animationDelay: `${step.delay}s` } as CSSProperties}
                >
                  {ordinal(r.rank, locale)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="titre-classement"
          className="carte motion-safe:animate-monte flex min-w-0 flex-col p-5 [animation-delay:120ms] sm:p-6"
        >
          <h2 id="titre-classement" className="font-display mb-3 text-2xl font-extrabold">
            {t.standings}
          </h2>
          {/* Les 9 colonnes (RES-02) défilent sur le côté : la zone reçoit le
              focus pour qu'on puisse la faire défiler au clavier. */}
          <div
            role="region"
            aria-labelledby="titre-classement"
            tabIndex={0}
            className="overflow-x-auto rounded-lg"
          >
            <table className="classement">
              <thead>
                <tr>
                  <th scope="col">{t.rank}</th>
                  <th scope="col">{t.player}</th>
                  <th scope="col" className="text-right">
                    {t.wpm}
                  </th>
                  <th scope="col" className="text-right">
                    {t.rawWpm}
                  </th>
                  <th scope="col" className="text-right">
                    {t.accuracy}
                  </th>
                  <th scope="col" className="text-right">
                    {t.errors}
                  </th>
                  <th scope="col" className="text-right">
                    {t.time}
                  </th>
                  <th scope="col">{t.status}</th>
                  <th scope="col">{t.bonuses}</th>
                </tr>
              </thead>
              <tbody>
                {racers.map((r) => (
                  <tr key={r.id} className={r.id === meId ? "moi" : ""}>
                    <td className="font-display text-xl font-extrabold">{r.rank}</td>
                    <th scope="row">
                      <span className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{r.name}</span>
                        {r.kind === "BOT" && <span className="badge">{t.bot}</span>}
                        {r.id === meId && <span className="badge">{t.you}</span>}
                        {records.includes(r.id) && (
                          <span className="badge badge-hote">{t.recordBadge}</span>
                        )}
                      </span>
                    </th>
                    <td className={`${cell} font-bold`}>{number.format(r.wpm)}</td>
                    <td className={cell}>{number.format(r.rawWpm)}</td>
                    <td className={`${cell} whitespace-nowrap`}>{number.format(r.accuracy)} %</td>
                    <td className={cell}>{number.format(r.errors)}</td>
                    <td className={`${cell} whitespace-nowrap`}>{seconds(r.timeMs)}</td>
                    <td>
                      <StatusLabel status={r.status} label={t.statuses[r.status]} />
                    </td>
                    <td className="text-sm">
                      {r.bonuses.length > 0
                        ? r.bonuses.map((b) => t.bonusNames[b]).join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          {racers.some((r) => r.samples.length > 0) && (
            <div className="carte motion-safe:animate-monte min-w-0 p-5 [animation-delay:200ms] sm:p-6">
              <WpmChart
                series={racers.map((r) => ({
                  id: r.id,
                  name: r.name,
                  lane: r.lane,
                  isMe: r.id === meId,
                  samples: r.samples,
                }))}
                locale={locale}
                t={t.charts}
              />
            </div>
          )}
          {me && (
            <div className="carte motion-safe:animate-monte min-w-0 p-5 [animation-delay:260ms] sm:p-6">
              <KeyHeatmap missed={me.missed} locale={locale} t={t.charts} />
            </div>
          )}
        </div>
      </div>

      {actions}
    </div>
  );
}
