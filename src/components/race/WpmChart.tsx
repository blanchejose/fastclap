"use client";

import { useId, useState } from "react";
import type { Dictionary, Locale } from "@/i18n/dictionaries";

type WpmSeries = {
  id: string;
  name: string;
  lane: number; // couleur fixe par coureur (jamais par rang)
  isMe: boolean;
  samples: { t: number; wpm: number }[];
};

type Props = { series: WpmSeries[]; locale: Locale; t: Dictionary["charts"] };

const W = 560;
const H = 300;
const PAD = { top: 24, right: 96, bottom: 34, left: 44 };
const SLOTS = 8; // au-delà, les coureurs passent dans « Autres » (gris)

const colorOf = (lane: number) =>
  lane < SLOTS ? `var(--serie-${lane + 1})` : "var(--serie-autres)";

// Graduations rondes : un pas de 10, 20, 25 ou 50 MPM, 6 lignes au plus.
function yScale(value: number): { max: number; ticks: number[] } {
  const step = [10, 20, 25, 50, 100].find((s) => Math.ceil(value / s) <= 5) ?? 100;
  const max = Math.max(step, Math.ceil(value / step) * step);
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}

// MPM d'un coureur à l'instant t : sa dernière mesure à ou avant t.
function valueAt(samples: WpmSeries["samples"], t: number): number | null {
  let value: number | null = null;
  for (const s of samples) {
    if (s.t > t) break;
    value = s.wpm;
  }
  return value;
}

// RES-03 : évolution du MPM de tous les participants, sur un même graphique.
// Un seul axe vertical ; une ligne verticale suit le pointeur et l'infobulle
// donne la valeur de chaque coureur ; un tableau donne les mêmes données.
export function WpmChart({ series, locale, t }: Props) {
  const [hoverT, setHoverT] = useState<number | null>(null);
  const titleId = useId();
  const visible = series.filter((s) => s.samples.length > 0);
  if (visible.length === 0) return null;

  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA");
  const maxT = Math.max(1000, ...visible.flatMap((s) => s.samples.map((p) => p.t)));
  const { max: maxWpm, ticks: yTicks } = yScale(
    Math.max(...visible.flatMap((s) => s.samples.map((p) => p.wpm))),
  );
  const x = (ms: number) => PAD.left + (ms / maxT) * (W - PAD.left - PAD.right);
  const y = (wpm: number) => PAD.top + (1 - wpm / maxWpm) * (H - PAD.top - PAD.bottom);
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((maxT * f) / 1000));
  const times = [...new Set(visible.flatMap((s) => s.samples.map((p) => p.t)))].sort(
    (a, b) => a - b,
  );
  // Le joueur local est dessiné en dernier, par-dessus les autres.
  const ordered = [...visible].sort((a, b) => Number(a.isMe) - Number(b.isMe) || a.lane - b.lane);
  const labelled = visible.length <= 4; // étiquettes directes en bout de ligne

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ms =
      ((((event.clientX - box.left) / box.width) * W - PAD.left) / (W - PAD.left - PAD.right)) *
      maxT;
    // La ligne verticale se cale sur la mesure la plus proche.
    const nearest = times.reduce((a, b) => (Math.abs(b - ms) < Math.abs(a - ms) ? b : a), times[0]);
    setHoverT(nearest);
  }

  const readout =
    hoverT === null ? [] : visible.map((s) => ({ s, wpm: valueAt(s.samples, hoverT) }));

  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption id={titleId} className="font-display text-2xl font-extrabold">
        {t.wpmTitle}
      </figcaption>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label={t.legend}>
        {[...visible]
          .sort((a, b) => a.lane - b.lane)
          .map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-[3px] w-4 rounded-full"
                style={{ backgroundColor: colorOf(s.lane) }}
              />
              <span className={s.isMe ? "font-bold" : ""}>{s.name}</span>
            </li>
          ))}
      </ul>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-labelledby={titleId}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHoverT(null)}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--trait)" />
              <text
                x={PAD.left - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="fill-sourdine text-[14px]"
              >
                {number.format(v)}
              </text>
            </g>
          ))}
          {xTicks.map((s) => (
            <text
              key={s}
              x={x(s * 1000)}
              y={H - 12}
              textAnchor="middle"
              className="fill-sourdine text-[14px]"
            >
              {number.format(s)} s
            </text>
          ))}
          <text x={PAD.left - 8} y={12} textAnchor="end" className="fill-sourdine text-[14px]">
            {t.wpmAxis}
          </text>

          {ordered.map((s) => {
            const points = s.samples.map((p) => `${x(p.t)},${y(p.wpm)}`).join(" ");
            const last = s.samples.at(-1)!;
            return (
              <g key={s.id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={colorOf(s.lane)}
                  strokeWidth={s.isMe ? 3.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={x(last.t)}
                  cy={y(last.wpm)}
                  r={4.5}
                  fill={colorOf(s.lane)}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
                {labelled && (
                  <text
                    x={x(last.t) + 9}
                    y={y(last.wpm) + 4}
                    className={`fill-encre text-[14px] ${s.isMe ? "font-bold" : ""}`}
                  >
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}

          {hoverT !== null && (
            <line
              x1={x(hoverT)}
              x2={x(hoverT)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--sourdine)"
              strokeWidth={1}
            />
          )}
        </svg>

        {hoverT !== null && (
          <div
            className="bg-surface border-trait pointer-events-none absolute top-2 rounded-xl border-2 px-3 py-2 text-sm shadow-lg"
            style={
              x(hoverT) > W / 2
                ? { right: `${((W - x(hoverT)) / W) * 100 + 2}%` }
                : { left: `${(x(hoverT) / W) * 100 + 2}%` }
            }
          >
            <p className="text-sourdine mb-1 font-mono text-xs">
              {number.format(Math.round(hoverT / 1000))} s
            </p>
            <ul className="flex flex-col gap-0.5">
              {readout
                .filter((r) => r.wpm !== null)
                .sort((a, b) => (b.wpm ?? 0) - (a.wpm ?? 0))
                .map(({ s, wpm }) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-[3px] w-3 rounded-full"
                      style={{ backgroundColor: colorOf(s.lane) }}
                    />
                    <strong className="font-mono tabular-nums">{number.format(wpm ?? 0)}</strong>
                    <span className="text-sourdine">{s.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Les mêmes données en tableau : lisibles sans souris ni couleurs (A11Y). */}
      <details>
        <summary className="cursor-pointer font-bold">{t.showData}</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.time}
                </th>
                {visible.map((s) => (
                  <th key={s.id} scope="col" className="px-2 py-1 text-right">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((ms) => (
                <tr key={ms} className="border-trait border-t">
                  <th scope="row" className="px-2 py-1 text-left font-mono font-normal">
                    {number.format(Math.round(ms / 1000))} s
                  </th>
                  {visible.map((s) => (
                    <td key={s.id} className="px-2 py-1 text-right font-mono tabular-nums">
                      {number.format(valueAt(s.samples, ms) ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
