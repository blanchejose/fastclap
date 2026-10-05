"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { JoinResult, PlayerView, RaceView } from "@/lib/race/engine";
import { Runner } from "./Logo";

type Props = { code: string; token: string; meId: string; t: Dictionary["room"] };

const laneColors = ["text-orange", "text-bleu", "text-juste", "text-faute", "text-sourdine"];

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Composant client : la salle en direct. Il reçoit l'état de la course du
// serveur Socket.IO 10 fois par seconde et lui envoie chaque touche tapée.
export function RoomLive({ code, token, meId, t }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<RaceView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const [copied, setCopied] = useState(false);
  // Progression locale du joueur, affichée tout de suite (le serveur reste l'arbitre).
  const [typed, setTyped] = useState({ position: 0, wrong: false });

  useEffect(() => {
    const socket = io({ auth: { token } });
    socketRef.current = socket;
    socket.on("connect", () => {
      setError(null);
      // Rejoint aussi après une reconnexion : la progression est gardée (RACE-2).
      socket.emit("room:join", { code }, (result: JoinResult) => {
        if (!result.ok) setError(t.errors[result.reason]);
      });
    });
    socket.on("race:state", (next: RaceView) => setView(next));
    socket.on("room:kicked", () => setKicked(true));
    socket.on("connect_error", () => setError(t.errors.connection));
    return () => {
      socket.disconnect();
    };
  }, [code, token, t]);

  const me = view?.players.find((p) => p.id === meId);
  const state = view?.state;
  const text = view?.text ?? "";
  const isOrganizer = view?.organizerId === meId;

  // Au départ, et après une reconnexion, on reprend la position du serveur.
  const serverPosition = me?.position ?? 0;
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const raceKey = `${state === "RUNNING" || state === "COUNTDOWN" ? view?.startAt : "none"}`;
  if (raceKey !== syncedFor) {
    setSyncedFor(raceKey);
    setTyped({ position: serverPosition, wrong: false });
  } else if (serverPosition > typed.position) {
    setTyped({ position: serverPosition, wrong: false });
  }

  useEffect(() => {
    if (state === "RUNNING") inputRef.current?.focus();
  }, [state]);

  // Une lettre tapée : affichée tout de suite, puis envoyée au serveur.
  // Plusieurs lettres peuvent arriver d'un coup (accents, clavier de téléphone).
  function typeChars(chars: string) {
    if (state !== "RUNNING" || me?.status !== "RACING") return;
    let { position, wrong } = typed;
    for (const char of chars) {
      if (char === text[position]) {
        position += 1;
        wrong = false;
      } else {
        wrong = true;
      }
      socketRef.current?.emit("race:key", { char });
    }
    setTyped({ position, wrong });
  }

  // Touches simples : traitées dès qu'on appuie.
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || event.key.length !== 1) return;
    event.preventDefault();
    typeChars(event.key);
  }

  // Lettres composées (é avec une touche morte, ê, clavier de téléphone) :
  // elles arrivent par l'événement « input » plutôt que par la touche.
  function onInput(event: React.FormEvent<HTMLInputElement>) {
    if ((event.nativeEvent as InputEvent).isComposing) return;
    typeChars(event.currentTarget.value);
    event.currentTarget.value = "";
  }

  function onCompositionEnd(event: React.CompositionEvent<HTMLInputElement>) {
    typeChars(event.data);
    event.currentTarget.value = "";
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée : le code reste affiché en grand, l'élève peut le lire.
    }
  }

  const emit = (event: string, payload?: object) => socketRef.current?.emit(event, payload);

  if (kicked) return <Notice>{t.kicked}</Notice>;
  if (error) return <Notice>{error}</Notice>;
  if (!view) return <p className="text-sourdine">…</p>;

  const seconds = (until: number | null) =>
    until ? Math.max(0, Math.ceil((until - view.serverNow) / 1000)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" aria-live="polite">
        {state === "COUNTDOWN" ? `${t.countdown} ${seconds(view.startAt)}` : ""}
        {me?.status === "FINISHED" ? fmt(t.finishedYou, { rank: me.rank }) : ""}
      </p>

      {(state === "LOBBY" || state === "WAITING") && (
        <div className="flex flex-wrap gap-6">
          <section className="bg-bleu flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl p-7 text-white">
            <span className="font-mono text-xs font-semibold tracking-widest text-white/80 uppercase">
              {t.code}
            </span>
            <span className="font-mono text-6xl font-semibold tracking-widest">
              {formatCode(code)}
            </span>
            <p className="text-white/90">{t.share}</p>
            <button
              type="button"
              onClick={copyCode}
              className="text-nuit min-h-11 self-start rounded-xl bg-white px-4 font-bold transition hover:bg-[#E6EAFB]"
            >
              {copied ? t.copied : t.copy}
            </button>
          </section>

          <section className="bg-surface flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-3xl p-7">
            <h2 className="font-display text-3xl font-extrabold">
              {t.players} · {view.players.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {view.players.map((p, i) => (
                <li
                  key={p.id}
                  className="bg-surface-2 flex items-center gap-3 rounded-2xl px-4 py-2.5"
                >
                  <span className={laneColors[i % laneColors.length]}>
                    <Runner className="size-7" />
                  </span>
                  <span className="flex-1 font-semibold">
                    {p.username}
                    {p.id === view.organizerId && (
                      <span className="text-sourdine ml-2 text-sm">({t.organizer})</span>
                    )}
                    {p.id === meId && <span className="text-sourdine ml-2 text-sm">({t.you})</span>}
                  </span>
                  {isOrganizer && p.id !== meId && (
                    <button
                      type="button"
                      onClick={() => emit("room:kick", { playerId: p.id })}
                      className="text-faute hover:bg-surface min-h-11 rounded-lg px-3 text-sm font-semibold"
                    >
                      {fmt(t.kick, { name: p.username })}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-sourdine">
              {state === "LOBBY"
                ? t.waitingPlayers
                : fmt(t.waitingStart, { s: seconds(view.waitEndsAt) })}
            </p>
            {isOrganizer && (
              <button
                type="button"
                disabled={state !== "WAITING"}
                onClick={() => emit("race:start")}
                className="bg-jaune font-display text-nuit min-h-14 self-start rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.start}
              </button>
            )}
          </section>
        </div>
      )}

      {state === "COUNTDOWN" && (
        <section className="bg-bleu flex flex-col items-center gap-2 rounded-3xl py-16 text-white">
          <span className="font-mono text-sm font-semibold tracking-widest uppercase">
            {t.countdown}
          </span>
          <span
            key={seconds(view.startAt)}
            className="font-display motion-safe:animate-pulse-lent text-[10rem] leading-none font-extrabold"
          >
            {seconds(view.startAt)}
          </span>
        </section>
      )}

      {(state === "RUNNING" || state === "FINISHED") && (
        <>
          <label
            htmlFor="zone-frappe"
            className="bg-surface ring-trait focus-within:ring-focus relative block cursor-text rounded-3xl p-6 font-mono text-2xl leading-[1.8] ring-2 focus-within:ring-[3px]"
          >
            <span className="sr-only">{t.typeHere}</span>
            <span aria-hidden="true">
              <span className="text-juste">{text.slice(0, typed.position)}</span>
              {typed.position < text.length && (
                <span
                  className={`border-orange border-l-[3px] ${typed.wrong ? "bg-faute/15 text-faute underline decoration-wavy" : ""}`}
                >
                  {text[typed.position]}
                </span>
              )}
              <span className="text-sourdine">{text.slice(typed.position + 1)}</span>
            </span>
            <input
              id="zone-frappe"
              ref={inputRef}
              onKeyDown={onKeyDown}
              onInput={onInput}
              onCompositionEnd={onCompositionEnd}
              onPaste={(e) => e.preventDefault()} // ROOM-4 : copier-coller désactivé
              onDrop={(e) => e.preventDefault()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={state !== "RUNNING"}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </label>
          {typed.wrong && state === "RUNNING" && (
            <p role="alert" className="text-faute font-semibold">
              {t.fixError}
            </p>
          )}

          <ol className="bg-surface flex flex-col gap-3 rounded-3xl p-6">
            {view.players.map((p, i) => (
              <Lane
                key={p.id}
                player={p}
                index={i}
                textLength={text.length}
                isMe={p.id === meId}
                t={t}
              />
            ))}
          </ol>

          {state === "RUNNING" && me?.status === "RACING" && (
            <button
              type="button"
              onClick={() => emit("race:abandon")}
              className="border-faute text-faute min-h-11 self-start rounded-xl border-2 px-4 font-semibold"
            >
              {t.abandon}
            </button>
          )}
        </>
      )}

      {state === "FINISHED" && (
        <section className="bg-bleu flex flex-col gap-5 rounded-3xl p-7 text-white">
          <h2 className="font-display text-4xl font-extrabold">{t.podium}</h2>
          <ol className="flex flex-wrap items-end justify-center gap-4">
            {[1, 0, 2].map((i) => {
              const p = view.players[i];
              if (!p) return null;
              const height = ["h-40", "h-28", "h-20"][i];
              return (
                <li key={p.id} className="flex w-32 flex-col items-center gap-2">
                  <Runner className="text-jaune size-10" />
                  <span className="font-bold">{p.username}</span>
                  <span className="font-mono text-sm">{p.wpm} WPM</span>
                  <span
                    className={`font-display text-nuit flex w-full items-start justify-center rounded-t-2xl bg-white pt-2 text-4xl font-extrabold ${height}`}
                  >
                    {i + 1}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="text-nuit overflow-x-auto rounded-2xl bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t.results}</caption>
              <thead>
                <tr className="border-b border-[#E6EAFB]">
                  <th className="p-3">{t.rank}</th>
                  <th className="p-3">{t.player}</th>
                  <th className="p-3">{t.speed}</th>
                  <th className="p-3">{t.precision}</th>
                </tr>
              </thead>
              <tbody>
                {view.players.map((p) => (
                  <tr key={p.id} className="border-b border-[#E6EAFB] last:border-0">
                    <td className="p-3 font-bold">{p.rank}</td>
                    <td className="p-3">
                      {p.username}
                      {p.status === "ABANDONED" && (
                        <span className="ml-2 text-[#4F5682]">({t.abandoned})</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{p.wpm} WPM</td>
                    <td className="p-3 font-mono">{p.accuracy} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isOrganizer ? (
            <button
              type="button"
              onClick={() => emit("race:restart")}
              className="bg-jaune font-display text-nuit min-h-14 self-start rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
            >
              {t.restart}
            </button>
          ) : (
            <p className="text-white/90">{t.waitRestart}</p>
          )}
        </section>
      )}
    </div>
  );
}

function Lane({
  player,
  index,
  textLength,
  isMe,
  t,
}: {
  player: PlayerView;
  index: number;
  textLength: number;
  isMe: boolean;
  t: Dictionary["room"];
}) {
  const progress = textLength > 0 ? Math.min(1, player.position / textLength) : 0;
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)_76px] items-center gap-3">
      <span className="font-display text-xl font-extrabold">{player.rank}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold">
          {player.username}
          {isMe && <span className="text-sourdine ml-1.5">({t.you})</span>}
          {!player.connected && <span className="text-sourdine ml-1.5">({t.disconnected})</span>}
          {player.status === "ABANDONED" && (
            <span className="text-faute ml-1.5">({t.abandoned})</span>
          )}
        </span>
        <div className="border-trait relative h-9 border-b-[3px] border-dashed">
          <span
            className={`absolute bottom-0 transition-[left] duration-150 ${isMe ? "text-orange" : laneColors[(index + 1) % laneColors.length]}`}
            style={{ left: `calc(${progress * 100}% - ${progress * 28}px)` }}
          >
            <Runner className="size-7" />
          </span>
        </div>
      </div>
      <span className="text-right font-mono text-sm font-semibold">{player.wpm} WPM</span>
    </li>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
      {children}
    </p>
  );
}
