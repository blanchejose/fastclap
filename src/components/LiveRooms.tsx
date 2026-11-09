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

  const select = "border-trait bg-surface min-h-11 rounded-xl border-2 px-3 font-normal";

  return (
    <div className="flex flex-col gap-4">
      {showFilters && (
        <form
          className="flex flex-wrap items-end gap-4"
          aria-label={t.filters}
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="flex flex-col gap-1 font-bold">
            {t.language}
            <select
              className={select}
              value={filters.language ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  language: (e.target.value || undefined) as Language | undefined,
                })
              }
            >
              <option value="">{t.all}</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {t.languages[l]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-bold">
            {t.complexity}
            <select
              className={select}
              value={filters.complexity ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  complexity: (e.target.value || undefined) as Complexity | undefined,
                })
              }
            >
              <option value="">{t.all}</option>
              {COMPLEXITIES.map((c) => (
                <option key={c} value={c}>
                  {t.levels[c]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sourdine flex items-center gap-2 pb-2 text-sm">
            <span
              aria-hidden="true"
              className="bg-juste motion-safe:animate-pulse-lent size-2.5 rounded-full"
            />
            {t.live}
          </p>
        </form>
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
              <Link
                href="/salles#creer"
                className="bg-bleu rounded-xl px-5 py-3 font-bold text-white transition hover:-translate-y-0.5"
              >
                {t.createRoom}
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul
          aria-live="polite"
          className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4"
        >
          {rooms.map((room) => {
            const joinable = room.phase === "WAITING" || room.phase === "RESULTS";
            return (
              <li key={room.code}>
                <Link
                  href={`/salle/${room.code}`}
                  className="bg-surface hover:border-bleu flex h-full flex-col gap-3 rounded-3xl border-2 border-transparent p-5 transition hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[15px] font-semibold tracking-wider">
                      {formatCode(room.code)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        joinable ? "bg-surface-2" : "bg-encre text-piste"
                      }`}
                    >
                      {t.states[room.phase]}
                    </span>
                  </span>
                  <span className="font-display text-2xl leading-tight font-extrabold">
                    {fmt(t.roomOf, { name: room.hostName })}
                  </span>
                  <span className="text-sourdine flex flex-wrap gap-x-3 text-sm">
                    <span>{fmt(t.players, { n: room.players, max: room.maxPlayers })}</span>
                    <span>{t.languages[room.language]}</span>
                    <span>{t.levels[room.complexity]}</span>
                  </span>
                  {!joinable && <span className="text-sm">{t.waitResults}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
