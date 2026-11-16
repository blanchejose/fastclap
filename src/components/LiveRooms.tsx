"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { Filters, RoomSummary } from "@/lib/explorer";
import { COMPLEXITIES, LANGUAGES, type Complexity, type Language } from "@/lib/race/config";

type Props = {
  initial: RoomSummary[];
  limit: number;
  showFilters: boolean;
  t: Dictionary["explorer"] & {
    levels: Dictionary["levels"];
    languages: Dictionary["config"]["languages"];
  };
};

const REFRESH_MS = 3_000;

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Un groupe de boutons à bascule : « Toutes » puis chaque valeur.
function Segment<T extends string>({
  label,
  allLabel,
  values,
  names,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  values: readonly T[];
  names: Record<T, string>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-sourdine text-sm font-bold">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        <button type="button" aria-pressed={!value} onClick={() => onChange(undefined)}>
          {allLabel}
        </button>
        {values.map((v) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {names[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

// JOIN-02 : la liste se met à jour toute seule toutes les 3 secondes, avec
// les filtres de langue et de complexité.
export function LiveRooms({ initial, limit, showFilters, t }: Props) {
  const [rooms, setRooms] = useState(initial);
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const params = new URLSearchParams({ limite: String(limit) });
      if (filters.language) params.set("langue", filters.language);
      if (filters.complexity) params.set("complexite", filters.complexity);
      try {
        const response = await fetch(`/api/salles?${params}`, { cache: "no-store" });
        if (response.ok && !stopped) setRooms((await response.json()) as RoomSummary[]);
      } catch {
        // Réseau coupé : on garde la dernière liste et on réessaie au tour suivant.
      }
    };
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [filters, limit]);

  return (
    <div className="flex flex-col gap-5">
      {showFilters && (
        <div
          role="group"
          aria-label={t.filters}
          className="carte motion-safe:animate-monte flex flex-wrap items-center gap-x-6 gap-y-3 p-3.5 [animation-delay:80ms]"
        >
          <Segment
            label={t.language}
            allLabel={t.all}
            values={LANGUAGES}
            names={t.languages}
            value={filters.language}
            onChange={(language: Language | undefined) => setFilters({ ...filters, language })}
          />
          <Segment
            label={t.complexity}
            allLabel={t.all}
            values={COMPLEXITIES}
            names={t.levels}
            value={filters.complexity}
            onChange={(complexity: Complexity | undefined) =>
              setFilters({ ...filters, complexity })
            }
          />
        </div>
      )}

      {rooms.length === 0 ? (
        // État vide : dire ce qui se passe, puis offrir l'action qui le règle.
        <div className="border-trait flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-3xl border-2 border-dashed p-6 sm:p-8">
          {showFilters && (filters.language || filters.complexity) ? (
            <p className="text-sourdine">{t.noMatch}</p>
          ) : (
            <>
              <div className="flex max-w-[40em] flex-col gap-1">
                <p className="text-lg font-bold">{t.emptyTitle}</p>
                <p className="text-sourdine">{t.empty}</p>
              </div>
              <Link href="/salles#creer" className="btn btn-bleu">
                {t.createRoom}
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul
          aria-live="polite"
          className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
        >
          {rooms.map((room, i) => {
            const joinable = room.phase === "WAITING" || room.phase === "RESULTS";
            return (
              <li
                key={room.code}
                className="motion-safe:animate-monte"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <Link
                  href={`/salle/${room.code}`}
                  className="carte souleve flex h-full flex-col gap-4 border-2 border-transparent p-6"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="bg-surface-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold">
                      <span
                        aria-hidden="true"
                        className={`live ${joinable ? "bg-juste motion-safe:animate-pulse-lent" : ""}`}
                      />
                      {t.states[room.phase]}
                    </span>
                    <span className="text-sourdine font-mono text-[13px] font-bold tracking-[0.12em]">
                      {formatCode(room.code)}
                    </span>
                  </span>
                  <span className="flex flex-col gap-2">
                    <span className="font-display text-[26px] leading-tight font-extrabold">
                      {fmt(t.roomOf, { name: room.hostName })}
                    </span>
                    <span className="flex flex-wrap gap-1.5 text-[13px] font-bold">
                      <span className="bg-surface-2 rounded-full px-2.5 py-1">
                        {t.languages[room.language]}
                      </span>
                      <span className="bg-surface-2 rounded-full px-2.5 py-1">
                        {t.levels[room.complexity]}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col gap-2">
                    {/* Jauge de remplissage de la salle. */}
                    <span
                      aria-hidden="true"
                      className="bg-surface-2 h-2 overflow-hidden rounded-full"
                    >
                      <span
                        className="bg-bleu jauge block h-full rounded-full"
                        style={{ width: `${Math.round((room.players / room.maxPlayers) * 100)}%` }}
                      />
                    </span>
                    <span className="text-sourdine font-mono text-[13px] font-bold">
                      {fmt(t.players, { n: room.players, max: room.maxPlayers })}
                    </span>
                  </span>
                  {joinable ? (
                    <span className="btn btn-bleu mt-auto min-h-12">{t.enter}</span>
                  ) : (
                    <span className="text-sourdine mt-auto text-sm">{t.waitResults}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
