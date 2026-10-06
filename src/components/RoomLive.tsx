"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { JoinResult, LobbyView } from "@/lib/lobby";
import { Runner } from "./Logo";

type Props = { code: string; token: string; meId: string; t: Dictionary["room"] };

const laneColors = ["text-orange", "text-bleu", "text-juste", "text-faute", "text-sourdine"];

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Composant client : la salle d'attente en direct. Le serveur Socket.IO lui
// envoie la liste des joueurs à chaque arrivée, départ ou retrait.
export function RoomLive({ code, token, meId, t }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const [view, setView] = useState<LobbyView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socket = io({ auth: { token } });
    socketRef.current = socket;
    socket.on("connect", () => {
      setError(null);
      // Rejoint aussi après une reconnexion.
      socket.emit("room:join", { code }, (result: JoinResult) => {
        if (!result.ok) setError(t.errors[result.reason]);
      });
    });
    socket.on("room:state", (next: LobbyView) => setView(next));
    socket.on("room:kicked", () => setKicked(true));
    socket.on("connect_error", () => setError(t.errors.connection));
    return () => {
      socket.disconnect();
    };
  }, [code, token, t]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée : le code reste affiché en grand, l'élève peut le lire.
    }
  }

  if (kicked) return <Notice>{t.kicked}</Notice>;
  if (error) return <Notice>{error}</Notice>;
  if (!view) return <p className="text-sourdine">…</p>;

  const isOrganizer = view.organizerId === meId;

  return (
    <div className="flex flex-wrap gap-6">
      <section className="bg-bleu flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl p-7 text-white">
        <span className="font-mono text-xs font-semibold tracking-widest text-white/80 uppercase">
          {t.code}
        </span>
        <span className="font-mono text-6xl font-semibold tracking-widest">{formatCode(code)}</span>
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
        {/* Annonce les arrivées et départs aux lecteurs d'écran. */}
        <ul className="flex flex-col gap-2" aria-live="polite">
          {view.players.map((p, i) => (
            <li key={p.id} className="bg-surface-2 flex items-center gap-3 rounded-2xl px-4 py-2.5">
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
                  onClick={() => socketRef.current?.emit("room:kick", { playerId: p.id })}
                  className="text-faute hover:bg-surface min-h-11 rounded-lg px-3 text-sm font-semibold"
                >
                  {fmt(t.kick, { name: p.username })}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sourdine">{view.state === "LOBBY" ? t.waitingPlayers : t.ready}</p>
        {isOrganizer && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              aria-describedby="course-bientot"
              className="bg-jaune font-display text-nuit min-h-14 cursor-not-allowed self-start rounded-2xl px-7 text-2xl font-extrabold opacity-50 shadow-[0_5px_0_var(--orange)]"
            >
              {t.start}
            </button>
            <p id="course-bientot" className="text-sourdine text-sm">
              {t.raceSoon}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
      {children}
    </p>
  );
}
