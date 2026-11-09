"use client";

import { useId, useState } from "react";
import { fmt, type Dictionary, type Locale } from "@/i18n/dictionaries";

type Props = {
  points: { at: string; wpm: number }[];
  locale: Locale;
  t: Dictionary["profile"] & { wpmAxis: string; showData: string; time: string };
};

const W = 640;
const H = 240;
const PAD = { top: 24, right: 20, bottom: 30, left: 44 };

// AUTH-06 : MPM de chaque course terminée, de la plus ancienne à la plus
// récente. Une seule série : le titre la nomme, pas de légende. Infobulle au
// survol et tableau des données pour lire les valeurs sans souris.
export function ProgressChart({ points, locale, t }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const tag = locale === "fr" ? "fr-CA" : "en-CA";
  const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const date = new Intl.DateTimeFormat(tag, { dateStyle: "medium" });

  if (points.length === 0)
    return (
      <figure className="flex flex-col gap-3">
        <figcaption id={titleId} className="font-display text-2xl font-extrabold">
          {t.progressTitle}
        </figcaption>
        <p className="text-sourdine">{t.progressEmpty}</p>
      </figure>
    );

  const step =
    [10, 20, 25, 50, 100].find((s) => Math.ceil(Math.max(...points.map((p) => p.wpm)) / s) <= 5) ??
    100;
  const max = Math.max(step, Math.ceil(Math.max(...points.map((p) => p.wpm)) / step) * step);
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? 0.5 : i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (wpm: number) => PAD.top + (1 - wpm / max) * (H - PAD.top - PAD.bottom);
  const line = points.map((p, i) => `${x(i)},${y(p.wpm)}`).join(" ");

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    let nearest = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    });
    setHover(nearest);
  }

  return (
    <figure className="flex flex-col gap-3">
      <figcaption id={titleId} className="font-display text-2xl font-extrabold">
        {t.progressTitle}
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-labelledby={titleId}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--trait)" />
              <text
                x={PAD.left - 8}
                y={y(v) + 5}
                textAnchor="end"
                className="fill-sourdine text-[14px]"
              >
                {number.format(v)}
              </text>
            </g>
          ))}
          <text x={PAD.left - 8} y={12} textAnchor="end" className="fill-sourdine text-[14px]">
            {t.wpmAxis}
          </text>
          <polyline
            points={line}
            fill="none"
            stroke="var(--serie-1)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={p.at}
              cx={x(i)}
              cy={y(p.wpm)}
              r={hover === i ? 6 : 4}
              fill="var(--serie-1)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--sourdine)"
            />
          )}
        </svg>
        {hover !== null && (
          <div
            className="bg-surface border-trait pointer-events-none absolute top-2 rounded-xl border-2 px-3 py-2 text-sm shadow-lg"
            style={
              x(hover) > W / 2
                ? { right: `${((W - x(hover)) / W) * 100 + 2}%` }
                : { left: `${(x(hover) / W) * 100 + 2}%` }
            }
          >
            <p className="text-sourdine font-mono text-xs">
              {fmt(t.raceN, { n: hover + 1 })} · {date.format(new Date(points[hover].at))}
            </p>
            <p>
              <strong className="font-mono">{number.format(points[hover].wpm)}</strong>{" "}
              <span className="text-sourdine">{t.wpmAxis}</span>
            </p>
          </div>
        )}
      </div>
      <details>
        <summary className="cursor-pointer font-bold">{t.showData}</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  #
                </th>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.time}
                </th>
                <th scope="col" className="px-2 py-1 text-right">
                  {t.wpmAxis}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.at} className="border-trait border-t">
                  <th scope="row" className="px-2 py-1 text-left font-normal">
                    {i + 1}
                  </th>
                  <td className="px-2 py-1">{date.format(new Date(p.at))}</td>
                  <td className="px-2 py-1 text-right font-mono tabular-nums">
                    {number.format(p.wpm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
